import { act, renderHook } from "@testing-library/react-native";

import { useRowMutationState } from "../useRowMutationState";

const setup = () => renderHook(() => useRowMutationState<string>());

describe("useRowMutationState", () => {
  it("starts with no active row and no errors", async () => {
    const { result } = await setup();

    expect(result.current.isActive("a")).toBe(false);
    expect(result.current.errorFor("a")).toBeNull();
  });

  it("marks a row as active once it begins", async () => {
    const { result } = await setup();

    await act(() => result.current.begin("a"));

    expect(result.current.isActive("a")).toBe(true);
    expect(result.current.isActive("b")).toBe(false);
  });

  it("clears the active row when it succeeds", async () => {
    const { result } = await setup();
    await act(() => result.current.begin("a"));

    await act(() => result.current.succeed("a"));

    expect(result.current.isActive("a")).toBe(false);
  });

  it("keeps another row active when a different row succeeds", async () => {
    const { result } = await setup();
    await act(() => result.current.begin("b"));

    await act(() => result.current.succeed("a"));

    expect(result.current.isActive("b")).toBe(true);
  });

  it("stores the message and clears the active row when it fails", async () => {
    const { result } = await setup();
    await act(() => result.current.begin("a"));

    await act(() => result.current.fail("a", "boom"));

    expect(result.current.isActive("a")).toBe(false);
    expect(result.current.errorFor("a")).toBe("boom");
    expect(result.current.errorFor("b")).toBeNull();
  });

  it("removes a row's error when it later succeeds", async () => {
    const { result } = await setup();
    await act(() => result.current.fail("a", "boom"));

    await act(() => result.current.succeed("a"));

    expect(result.current.errorFor("a")).toBeNull();
  });

  it("removes only the cleared row's error", async () => {
    const { result } = await setup();
    await act(() => {
      result.current.fail("a", "first");
      result.current.fail("b", "second");
    });

    await act(() => result.current.clearError("a"));

    expect(result.current.errorFor("a")).toBeNull();
    expect(result.current.errorFor("b")).toBe("second");
  });
});
