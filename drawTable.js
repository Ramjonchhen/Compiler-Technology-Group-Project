export function drawSlrTable(slrTable) {
  let noOfActions = Object.entries(slrTable[0].actions).length;
  let noOfGoto = Object.entries(slrTable[0].gots).length;

  let tableHtml = "<table>";

  tableHtml += `<thead>
        <tr>
            <th rowpan="2">State</th>
            <th colspan=${noOfActions}>Action table</th>
            <th colspan=${noOfGoto}>Goto table</th>
        </tr>
    </thead>`;

    tableHtml += "<tbody></tbody>";
    tableHtml += "</table>";

    document.getElementById('slr-table').innerHTML += tableHtml;
}
