function sum(a, b) {
    return a + b;
}

test("adds numbers", () => {
    expect(sum(2, 3)).toBe(5);
});
