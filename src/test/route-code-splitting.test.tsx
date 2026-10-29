import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React, { lazy, Suspense } from "react";
import RouteLoadingFallback from "../components/common/RouteLoadingFallback";

describe("Route Code Splitting & Suspense Boundaries", () => {
  it("displays RouteLoadingFallback while lazy component is loading, then reveals component", async () => {
    let resolveComponent!: (value: { default: React.FC }) => void;
    const lazyPromise = new Promise<{ default: React.FC }>((resolve) => {
      resolveComponent = resolve;
    });

    const MockLazyPage = lazy(() => lazyPromise);

    render(
      <Suspense fallback={<RouteLoadingFallback />}>
        <MockLazyPage />
      </Suspense>
    );

    // Assert that loading fallback is rendered initially
    expect(screen.getByLabelText("頁面載入中")).toBeDefined();
    expect(screen.getByText("載入頁面中…")).toBeDefined();

    // Resolve the lazy import
    const DummyContent: React.FC = () => <div>Loaded Lazy Content</div>;
    resolveComponent({ default: DummyContent });

    // Wait for Suspense boundary to reveal loaded component
    await waitFor(() => {
      expect(screen.getByText("Loaded Lazy Content")).toBeDefined();
    });

    // Fallback should now be removed from document
    expect(screen.queryByLabelText("頁面載入中")).toBeNull();
  });

  it("handles multiple lazy routes independently without cascading fallback", async () => {
    let resolveFirst!: (value: { default: React.FC }) => void;
    let resolveSecond!: (value: { default: React.FC }) => void;

    const LazyFirst = lazy(
      () =>
        new Promise<{ default: React.FC }>((r) => {
          resolveFirst = r;
        })
    );
    const LazySecond = lazy(
      () =>
        new Promise<{ default: React.FC }>((r) => {
          resolveSecond = r;
        })
    );

    render(
      <div>
        <Suspense fallback={<div data-testid="fallback-1">Fallback 1</div>}>
          <LazyFirst />
        </Suspense>
        <Suspense fallback={<div data-testid="fallback-2">Fallback 2</div>}>
          <LazySecond />
        </Suspense>
      </div>
    );

    expect(screen.getByTestId("fallback-1")).toBeDefined();
    expect(screen.getByTestId("fallback-2")).toBeDefined();

    resolveFirst({ default: () => <div>Resolved 1</div> });

    await waitFor(() => {
      expect(screen.getByText("Resolved 1")).toBeDefined();
    });

    // Second is still in fallback
    expect(screen.getByTestId("fallback-2")).toBeDefined();

    resolveSecond({ default: () => <div>Resolved 2</div> });

    await waitFor(() => {
      expect(screen.getByText("Resolved 2")).toBeDefined();
    });
  });
});
