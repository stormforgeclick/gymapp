import { gymbroErrorKey } from "../errors";

describe("gymbroErrorKey", () => {
  it("explains that the person is unavailable", () => {
    expect(gymbroErrorKey({ message: "user unavailable" })).toBe(
      "gymbros.errorUnavailable"
    );
  });

  it("uses the generic message for any other failure", () => {
    expect(gymbroErrorKey({ message: "permission denied" })).toBe(
      "gymbros.errorGeneric"
    );
    expect(gymbroErrorKey(undefined)).toBe("gymbros.errorGeneric");
  });
});
