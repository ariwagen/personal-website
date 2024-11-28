import React, { useMemo, useState, useCallback } from "react";

import gmtkn55Subsets from "../data/gmtkn55/subsets.csv";
import gmtkn55Benchmarks from "../data/gmtkn55/benchmarks.js";

const nonNeutralCharge = [
  "ISOL24",
  "ALK8",
  "RSE43",
  "INV24",
  "RC21",
  "CHB6",
  "PArel",
  "PA26",
  "G21IP",
  "IL16",
  "WATER27",
  "SIE4x4",
  "UPU23",
  "BH76",
  "BH76RC",
  "AHB21",
  "G21EA",
  "DIPCS10",
];
const nonSingletMultiplicity = [
  "G21IP",
  "G21EA",
  "W4-11",
  "DC13",
  "BH76",
  "YBDE18",
  "MB16-43",
  "ALKBDE10",
  "RSE43",
  "RC21",
  "HEAVYSB11",
  "BH76RC",
  "SIE4x4",
];
const metals = [
  "AL2x6", // Al
  "ALK8", // Li, Na
  "ALKBDE10", // Be, Ca, K, etc.
  "CHB6", // Li, Na
  "G21IP", // Li, Be, B, etc.
  "HEAVY28", // Bi, etc.
  "HEAVYSB11", // Ge, etc.
  "G2RC", // Al, B, etc.
  "DC13", // Be
  "DIPCS10", // Mg, Be
  "MB16-43", // Na, Al, Mg, etc.
  "W4-11", // Al, etc.
];
const nobleGases = [
  "RG18", // Ne, Ar, Kr, etc.
  "SIE4x4", // He, etc.
];

const subsetCol = gmtkn55Subsets[0].findIndex((entry) => entry.toLowerCase() === "subset");
const descriptionCol = gmtkn55Subsets[0].findIndex(
  (entry) => entry.toLowerCase() === "description",
);
const numCol = gmtkn55Subsets[0].findIndex((entry) => entry.toLowerCase() === "num");
const weightCol = gmtkn55Subsets[0].findIndex((entry) => entry.toLowerCase() === "weight");
const categoryCol = gmtkn55Subsets[0].findIndex((entry) => entry.toLowerCase() === "category");

const GMTKN55 = () => {
  const [viewSubsets, setViewSubsets] = useState(false);
  const [sortOn, setSortOn] = useState("All");

  const [onlyNeutral, setOnlyNeutral] = useState(true);
  const [onlySinglet, setOnlySinglet] = useState(true);
  const [noMetals, setNoMetals] = useState(true);
  const [noNobleGases, setNoNobleGases] = useState(true);

  const excludedSubsetsLowercase = useMemo(() => {
    let excludedSubsets = [];
    if (onlyNeutral) excludedSubsets.push(...nonNeutralCharge);
    if (onlySinglet) excludedSubsets.push(...nonSingletMultiplicity);
    if (noMetals) excludedSubsets.push(...metals);
    if (noNobleGases) excludedSubsets.push(...nobleGases);
    return excludedSubsets.map((subset) => subset.toLowerCase());
  }, [onlyNeutral, onlySinglet, noMetals, noNobleGases]);

  const calculateWeightedMAE = useCallback(
    (benchmark, category) => {
      let totalWeightedMAE = 0;
      let totalWeight = 0;

      const filteredRows = gmtkn55Subsets.filter((row) =>
        !excludedSubsetsLowercase.includes(row[subsetCol].toLowerCase())
          ? category === "All"
            ? true
            : row[categoryCol] === category
          : false,
      );
      const filteredSubsets = filteredRows.map((row) => row[subsetCol].toLowerCase());

      const benchmarkSubsetCol = benchmark[0].findIndex(
        (entry) => entry.toLowerCase() === "subset",
      );
      const benchmarkCompletedCol = benchmark[0].findIndex(
        (entry) => entry.toLowerCase() === "completed",
      );
      const benchmarkMaeCol = benchmark[0].findIndex((entry) => entry.toLowerCase() === "mae");

      benchmark.forEach((benchmarkRow, i) => {
        if (i === 0) return; // ignore headers
        const currentSubset = benchmarkRow[benchmarkSubsetCol].toLowerCase();
        if (
          filteredSubsets.includes(currentSubset) &&
          benchmarkRow[benchmarkCompletedCol].toLowerCase() === "true"
        ) {
          const weight = parseFloat(
            gmtkn55Subsets.find((row) => row[subsetCol].toLowerCase() === currentSubset)[weightCol],
          );
          const num = parseFloat(
            gmtkn55Subsets.find((row) => row[subsetCol].toLowerCase() === currentSubset)[numCol],
          );
          const mae = parseFloat(benchmarkRow[benchmarkMaeCol]) || 0;
          totalWeightedMAE += mae * weight * num;
          totalWeight += num;
        }
      });

      return totalWeight > 0 ? totalWeightedMAE / totalWeight : null;
    },
    [excludedSubsetsLowercase],
  );

  const findSkippedSubsets = (benchmark) => {
    let numSkipped = 0;

    const filteredRows = gmtkn55Subsets.filter(
      (row) => !excludedSubsetsLowercase.includes(row[subsetCol].toLowerCase()),
    );
    const filteredSubsets = filteredRows.map((row) => row[subsetCol].toLowerCase());

    const benchmarkSubsetCol = benchmark[0].findIndex((entry) => entry.toLowerCase() === "subset");
    const benchmarkCompletedCol = benchmark[0].findIndex(
      (entry) => entry.toLowerCase() === "completed",
    );

    benchmark.forEach((benchmarkRow, i) => {
      if (i === 0) return; // ignore headers
      const currentSubset = benchmarkRow[benchmarkSubsetCol].toLowerCase();
      if (
        filteredSubsets.includes(currentSubset) &&
        benchmarkRow[benchmarkCompletedCol].toLowerCase() === "false"
      ) {
        console.log("skipping " + currentSubset);
        numSkipped += 1;
      }
    });

    return numSkipped > 0 ? numSkipped : null;
  };

  const categories = [
    {
      display: "Small Systems",
      name: "Basic properties and reaction energies for small systems",
    },
    {
      display: "Large Systems",
      name: "Reaction energies for large systems and isomerisation reactions",
    },
    {
      display: "Barrier Heights",
      name: "Reaction barrier heights",
    },
    {
      display: "Intramolecular NCIs",
      name: "Intramolecular noncovalent interactions",
    },
    {
      display: "Intermolecular NCIs",
      name: "Intermolecular noncovalent interactions",
    },
    {
      display: "All",
      name: "All",
    },
  ];

  const subsets = useMemo(() => {
    let subsets = [];
    gmtkn55Subsets.forEach((row, i) => {
      if (i !== 0 && !excludedSubsetsLowercase.includes(row[subsetCol].toLowerCase())) {
        subsets.push({
          subset: row[subsetCol],
          subsetLowercase: row[subsetCol].toLowerCase(),
          description: row[descriptionCol],
        });
      }
    });
    return subsets;
  }, [excludedSubsetsLowercase]);

  const data = useMemo(
    () =>
      Object.keys(gmtkn55Benchmarks).map((nnp) => {
        const benchmark = gmtkn55Benchmarks[nnp].benchmark;

        let row = {
          name: nnp,
          skipped: findSkippedSubsets(benchmark),
          from: gmtkn55Benchmarks[nnp].from,
          reference: gmtkn55Benchmarks[nnp].reference || false,
        };
        categories.forEach((category) => {
          row[category.name] = calculateWeightedMAE(benchmark, category.name);
        });

        const benchmarkSubsetCol = benchmark[0].findIndex(
          (entry) => entry.toLowerCase() === "subset",
        );
        const benchmarkCompletedCol = benchmark[0].findIndex(
          (entry) => entry.toLowerCase() === "completed",
        );
        const benchmarkMaeCol = benchmark[0].findIndex((entry) => entry.toLowerCase() === "mae");

        benchmark.forEach((benchmarkRow) => {
          row[benchmarkRow[benchmarkSubsetCol].toLowerCase()] =
            benchmarkRow[benchmarkCompletedCol]?.toLowerCase() === "true"
              ? Number(benchmarkRow[benchmarkMaeCol])
              : null;
        });
        return row;
      }),
    [calculateWeightedMAE],
  );

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (typeof a[sortOn] === "number" && typeof b[sortOn] === "number") {
        return a[sortOn] - b[sortOn];
      } else if (typeof a[sortOn] === "string" && typeof b[sortOn] === "string") {
        return a[sortOn].localeCompare(b[sortOn]);
      }
      return 0;
    });
  }, [data, sortOn]);

  return (
    <>
      <div style={{ marginBottom: "1em" }}>
        <button onClick={() => setViewSubsets(!viewSubsets)}>
          {viewSubsets ? "View results by category" : "View results by subset"}
        </button>
        <br />
        <input
          id="onlyNeutral"
          type="checkbox"
          checked={onlyNeutral}
          onClick={() => setOnlyNeutral(!onlyNeutral)}
        />
        <label htmlFor="onlyNeutral">Only neutral systems?</label> <br />
        <input
          id="onlySinglet"
          type="checkbox"
          checked={onlySinglet}
          onClick={() => setOnlySinglet(!onlySinglet)}
        />
        <label htmlFor="onlySinglet">Only singlet systems?</label> <br />
        <input
          id="noMetals"
          type="checkbox"
          checked={noMetals}
          onClick={() => setNoMetals(!noMetals)}
        />
        <label htmlFor="noMetals">Exclude metal containing subsets?</label> <br />
        <input
          id="noNobleGases"
          type="checkbox"
          checked={noNobleGases}
          onClick={() => setNoNobleGases(!noNobleGases)}
        />
        <label htmlFor="noNobleGases">Exclude noble gas containing subsets?</label> <br />
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ paddingRight: "2ch" }}>Name</th>
            {viewSubsets ? (
              subsets.map((subset, i) => (
                <th style={{ paddingRight: "2ch" }} key={i} title={subset.description}>
                  {subset.subset}{" "}
                  <button onClick={() => setSortOn(subset.subsetLowercase)}>↓</button>
                </th>
              ))
            ) : (
              <>
                {categories.map((category, i) => (
                  <th style={{ paddingRight: "2ch" }} key={i}>
                    {category.display} <button onClick={() => setSortOn(category.name)}>↓</button>
                  </th>
                ))}
                <th style={{ paddingRight: "2ch" }}>Incomplete Subsets</th>
              </>
            )}
            <th style={{ paddingRight: "2ch" }}>Benchmarked By</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => {
            return (
              <tr key={i} style={row.reference ? { "font-style": "italic", opacity: 0.5 } : {}}>
                <td style={{ paddingRight: "2ch" }}>{row.name}</td>
                {viewSubsets ? (
                  subsets.map((subset, j) => (
                    <td style={{ paddingRight: "2ch" }} key={`${i}${j}`}>
                      {row[subset.subsetLowercase]?.toFixed(2)}
                    </td>
                  ))
                ) : (
                  <>
                    {categories.map((category, j) => (
                      <td style={{ paddingRight: "2ch" }} key={`${i}${j}`}>
                        {row[category.name]?.toFixed(2)}
                      </td>
                    ))}
                    <td style={{ paddingRight: "2ch" }}>{row.skipped}</td>
                  </>
                )}
                <td style={{ paddingRight: "2ch" }}>
                  {row.from.includes("http") ? <a href={row.from}>link</a> : row.from}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default GMTKN55;
