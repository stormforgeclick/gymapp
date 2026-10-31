import { moveItem } from "../array";

describe("moveItem", () => {
  it("moves an item forward", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item backward", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("moves an item to either end", () => {
    expect(moveItem(["a", "b", "c"], 1, 0)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 2)).toEqual(["a", "c", "b"]);
  });

  it("returns an equal copy when the item does not move", () => {
    const list = ["a", "b", "c"];
    const result = moveItem(list, 1, 1);

    expect(result).toEqual(list);
    expect(result).not.toBe(list);
  });

  it("does not change the list it was given", () => {
    const list = ["a", "b", "c"];

    moveItem(list, 0, 2);

    expect(list).toEqual(["a", "b", "c"]);
  });
});
