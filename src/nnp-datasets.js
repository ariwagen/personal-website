import React from 'react';
import ReactDOM from 'react-dom';
import csv from './data/datasets.csv';

const Table = () => {
  return (
    <table>
      <thead>
        <tr>
          {csv[0].map((header, index) => (
            <th key={index} style={{ "padding-right": "2ch" }}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {csv.filter((_, i) => i > 0).map((row, i) => (
          <tr key={i}>
            {Object.values(row).map((value, j) => (
              <td key={j} style={{ "padding-right": "2ch" }}>{value.includes("http") ? <a href={value}>link</a> : value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

ReactDOM.render(<Table />, document.getElementById('table'));
