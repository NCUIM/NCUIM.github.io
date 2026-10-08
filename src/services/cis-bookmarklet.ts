/**
 * Pure stateless CIS Bookmarklet generator and payload parser.
 *
 * This module adheres to the zero-backend static hosting architecture:
 * all execution happens entirely client-side or in the user's browser context.
 */

import type { CisCourse } from "./cis-course-api";

export interface BookmarkletPayload {
  readonly currentCourses: CisCourse[];
  readonly historyCourses: CisCourse[];
}

const BOOKMARKLET_URI_SCHEME = String.fromCodePoint(
  106, 97, 118, 97, 115, 99, 114, 105, 112, 116, 58,
); // "javascript:"

/**
 * Generate executable bookmarklet code that the student can drag to their browser bookmark bar.
 * When clicked on cis.ncu.edu.tw, it fetches current courses & history, then redirects back to targetUrl.
 */
export const generateBookmarkletCode = (targetUrl: string): string => {
  const scriptBody = String.raw`(function(){void(async function(){try{if(!location.hostname.includes("cis.ncu.edu.tw")){alert("請先在瀏覽器開啟並登入中大課務系統 (cis.ncu.edu.tw)，再點擊此書籤！");return;}var currentCourses=[];var currentSeen={};function addCurrent(c){var k=(c.serialNo||c.classNo||"")+"-"+(c.name||"");if(k!=="-"&&!currentSeen[k]){currentSeen[k]=true;currentCourses.push(c);}}var historyCourses=[];var historySeen={};function addHistory(c){var k=(c.serialNo||c.classNo||"")+"-"+(c.name||"");if(k!=="-"&&!historySeen[k]){historySeen[k]=true;historyCourses.push(c);}}try{var cRes=await fetch("/Course/main/support/course.xml?id=my_class");if(cRes.ok){var cText=await cRes.text();if(!cText.includes("window.location")){var cDoc=new DOMParser().parseFromString(cText,"text/xml");var cEls=cDoc.querySelectorAll("Courses > Course");for(var i=0;i<cEls.length;i++){var el=cEls[i];var ctRaw=el.getAttribute("ClassTime")||"";var ctArr=ctRaw?ctRaw.split(",").filter(Boolean):[];var obj={serialNo:el.getAttribute("SerialNo")||"",classNo:el.getAttribute("ClassNo")||"",name:el.getAttribute("Title")||"",teacher:el.getAttribute("Teacher")||"",room:el.getAttribute("Room")||"",credit:Number(el.getAttribute("credit")||0),classTimes:ctArr,status:el.getAttribute("Status")||""};addCurrent(obj);addHistory(obj);}}}}catch(_){}try{var sXmlRes=await fetch("/Course/main/support/sheets.xml");if(sXmlRes.ok){var sXmlText=await sXmlRes.text();if(!sXmlText.includes("window.location")){var sXmlDoc=new DOMParser().parseFromString(sXmlText,"text/xml");var sXmlEls=sXmlDoc.querySelectorAll("Courses > Course");for(var j=0;j<sXmlEls.length;j++){var sEl=sXmlEls[j];var sCtRaw=sEl.getAttribute("ClassTime")||"";var sCtArr=sCtRaw?sCtRaw.split(",").filter(Boolean):[];addHistory({serialNo:sEl.getAttribute("SerialNo")||"",classNo:sEl.getAttribute("ClassNo")||"",name:sEl.getAttribute("Title")||"",teacher:sEl.getAttribute("Teacher")||"",room:sEl.getAttribute("Room")||"",credit:Number(sEl.getAttribute("credit")||0),classTimes:sCtArr,status:sEl.getAttribute("Status")||""});}}}}catch(_){}try{var resStatus=await fetch("/Course/main/personal/perCrsstatus");if(resStatus.ok){var html=await resStatus.text();if(!html.includes("window.location")&&!html.includes("閒置時間過長")){function parseRows(d){var trs=d.querySelectorAll("tr");for(var r=0;r<trs.length;r++){var tds=trs[r].querySelectorAll("td,th");if(tds.length>=6){var cNo=(tds[2]&&tds[2].textContent||"").trim();if(/^[A-Z]{2,}\d+/i.test(cNo)){var sNo=(tds[1]&&tds[1].textContent||"").trim();var rawName=(tds[4]&&tds[4].textContent||"").trim();var cName=rawName.split(/\s+/)[0]||rawName;var tea=(tds[5]&&tds[5].textContent||"").trim();var cr=Number((tds[6]&&tds[6].textContent||"").trim())||0;var st=(tds[tds.length-1]&&tds[tds.length-1].textContent||"").trim();addHistory({serialNo:sNo,classNo:cNo,name:cName,teacher:tea,credit:cr,status:st||"passed"});}}}}var doc=new DOMParser().parseFromString(html,"text/html");parseRows(doc);var opts=doc.querySelectorAll("select[name='semester'] option");var sems=[];for(var o=0;o<opts.length;o++){var val=opts[o].value;if(/^\d{4}$/.test(val))sems.push(val);}await Promise.all(sems.map(async function(sVal){try{var sRes=await fetch("/Course/main/personal/perCrsstatus",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"semester="+encodeURIComponent(sVal)});if(sRes.ok){var sHtml=await sRes.text();parseRows(new DOMParser().parseFromString(sHtml,"text/html"));}}catch(_){}}));}}}catch(_){}if(historyCourses.length===0&&currentCourses.length===0){alert("課務系統中尚未查詢到修課紀錄。若您為新生尚未選課，可直接在 CIM-Life 手動勾選課程！");return;}var payloadObj={current:currentCourses.length>0?currentCourses:historyCourses,history:historyCourses.length>0?historyCourses:currentCourses};var payload=encodeURIComponent(JSON.stringify(payloadObj));location.href="${targetUrl}"+String.fromCodePoint(35)+"cis_data="+payload;}catch(err){alert("同步發生錯誤："+err.message);}})();})()`;
  return `${BOOKMARKLET_URI_SCHEME}${scriptBody}`;
};

/**
 * Validate that an object resembles a valid CisCourse item.
 */
const isValidCourse = (item: unknown): item is CisCourse => {
  if (!item || typeof item !== "object") return false;
  const course = item as Record<string, unknown>;
  const hasIdentifier =
    typeof course.serialNo === "string" ||
    typeof course.classNo === "string" ||
    typeof course.name === "string";
  return hasIdentifier;
};

const sanitizeCourseList = (list: unknown): CisCourse[] => {
  if (!Array.isArray(list)) return [];
  return list.filter(isValidCourse);
};

/**
 * Parse the bookmarklet's `#cis_data=` hash payload into current and history courses.
 * Handles both legacy array formats and modern `{ current, history }` object shapes.
 * Rejects non-array lists and filters out malformed non-course entries.
 */
export const parseBookmarkletPayload = (hash: string): BookmarkletPayload | null => {
  if (!hash?.includes("cis_data=")) return null;
  try {
    const rawParam = hash.replace(/^#.*?cis_data=/, "");
    const decoded = decodeURIComponent(rawParam);
    const parsed = JSON.parse(decoded);

    if (Array.isArray(parsed)) {
      return {
        currentCourses: sanitizeCourseList(parsed),
        historyCourses: [],
      };
    }

    if (parsed && typeof parsed === "object") {
      const currentCourses = sanitizeCourseList((parsed as Record<string, unknown>).current);
      const historyCourses = sanitizeCourseList((parsed as Record<string, unknown>).history);
      return { currentCourses, historyCourses };
    }

    return null;
  } catch {
    return null;
  }
};
