import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parsePeopleCsv, getNetWorthColor, formatNetWorth } from "../src/lib/dataParser.ts";
import { createLayoutTargets, LAYOUTS } from "../src/lib/sceneLayouts.ts";

test("the supplied CSV loads all 200 profiles and formatted currency", () => {
  const csv = new TextDecoder("windows-1252").decode(readFileSync(new URL("../public/data.csv", import.meta.url)));
  const people = parsePeopleCsv(csv);
  assert.equal(people.length, 200);
  assert.deepEqual(people[0], {
    id: "person-1", name: "Lee Siew Suan", photo: "https://static.kasatria.com/pivot-img/photo/019.jpg",
    age: 25, country: "CN", interest: "Writing", netWorth: 251260.8,
  });
  assert.equal(formatNetWorth(people[0].netWorth), "$251,260.80");
  const colors = people.reduce((counts, person) => {
    const color = getNetWorthColor(person.netWorth);
    counts[color] = (counts[color] ?? 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(colors, { "#21865b": 93, "#a83232": 21, "#bb7624": 86 });
});

test("CSV validation rejects missing columns, invalid ages and invalid money", () => {
  const header = "Name,Photo,Age,Country,Interest,Net Worth\n";
  assert.throws(() => parsePeopleCsv("Name,Age\nA,25"), /Missing CSV column/);
  for (const age of ["", "-1", "1.5", "unknown"]) {
    assert.throws(() => parsePeopleCsv(header + `A,,${age},MY,Writing,100`), /Invalid age/);
  }
  for (const worth of ["", "-1", "NaN", "Infinity", "unknown"]) {
    assert.throws(() => parsePeopleCsv(header + `A,,25,MY,Writing,${worth}`), /Invalid Net Worth/);
  }
});

test("net worth boundaries have consistent colors", () => {
  assert.equal(getNetWorthColor(99999.99), "#a83232");
  assert.equal(getNetWorthColor(100000), "#bb7624");
  assert.equal(getNetWorthColor(200000), "#bb7624");
  assert.equal(getNetWorthColor(200000.01), "#21865b");
});

test("the table is 20 by 10 and the grid is 5 by 4 by 10 with unique positions", () => {
  const targets = createLayoutTargets(200);
  const distinct = (objects, axis) => new Set(objects.map((object) => object.position[axis])).size;
  for (const layout of LAYOUTS) {
    assert.equal(targets[layout].length, 200);
    assert.equal(new Set(targets[layout].map((object) => object.position.toArray().join(","))).size, 200);
    assert.ok(targets[layout].every((object) => [...object.position.toArray(), ...object.quaternion.toArray()].every(Number.isFinite)));
  }
  assert.deepEqual(["x", "y", "z"].map((axis) => distinct(targets.Table, axis)), [20, 10, 1]);
  assert.deepEqual(["x", "y", "z"].map((axis) => distinct(targets.Grid, axis)), [5, 4, 10]);
});

test("the sphere has constant radius and the helix has two opposite strands at every level", () => {
  const targets = createLayoutTargets(200);
  for (const object of targets.Sphere) assert.ok(Math.abs(object.position.length() - 1100) < 1e-8);
  assert.equal(new Set(targets.Helix.map((object) => object.position.y)).size, 100);
  for (let index = 0; index < 200; index += 2) {
    const a = targets.Helix[index].position;
    const b = targets.Helix[index + 1].position;
    assert.equal(a.y, b.y);
    assert.ok(Math.abs(a.x + b.x) < 1e-8);
    assert.ok(Math.abs(a.z + b.z) < 1e-8);
    assert.ok(Math.abs(Math.hypot(a.x, a.z) - 1000) < 1e-8);
  }
  for (const count of [0, 1, 3]) {
    for (const objects of Object.values(createLayoutTargets(count))) {
      assert.equal(objects.length, count);
      assert.ok(objects.every((object) => object.position.toArray().every(Number.isFinite)));
    }
  }
});
