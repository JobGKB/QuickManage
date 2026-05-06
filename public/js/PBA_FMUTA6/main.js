// https://fme-gkb.fmecloud.com/fmerest/v3/repositories/Projecten/items/PBA_IW_Conversie.fmwAdministratie/PBA_FMUTA6_MaakIndexatieJSON.fmw 653d48815e91626f06f6ed871b3810605193ac02
// /https://fme-gkb.fmecloud.com/fmedatastreaming/Administratie/PBA_FMUTA6_MaakIndexatieJSON.fmw

 
let tableData = [];
let editMode = false;
const headers = ["Naam", "Jaar", "Week", "Indexatie"];

async function getData() {
  const url = "https://fme-gkb.fmecloud.com/api/IndexatieGrondbank/indexaties?DEBUG=NO";
  document.getElementById("indexatie-table").innerHTML = "<p>Data wordt opgehaald...</p>";
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "fmetoken token=c8fe3945982941066a1c4964d8a2ca5759e86c2b"
      }
      
    });

    if (!res.ok) {
      throw new Error(`FME error: ${res.status}`);
    }
    
    const data = await res.json();
    tableData = data;
    console.log("Data geladen:", tableData);
    renderTable();
  } catch (err) {
    document.getElementById("indexatie-table").innerHTML = `<p class="text-danger">Fout bij ophalen data: ${err.message}</p>`;
  }
}

function renderTable() {
  if (!tableData || tableData.length === 0) {
    document.getElementById("indexatie-table").innerHTML = "<p>Geen data gevonden.</p>";
    return;
  }

  // Sort by Week descending (highest first), then by Naam
  tableData.sort((a, b) => {
    const weekDiff = (parseInt(b.Week) || 0) - (parseInt(a.Week) || 0);
    if (weekDiff !== 0) return weekDiff;
    return (a.Naam || "").localeCompare(b.Naam || "");
  });

  let html = '<table class="table table-bordered">';
  html += "<thead><tr>";
  headers.forEach(h => { html += `<th>${h}</th>`; });
  html += "</tr></thead><tbody>";

  tableData.forEach((row, i) => {
    html += "<tr>";
    headers.forEach(h => {
      const canEdit = editMode && h === "Indexatie";
      if (canEdit) {
        const val = row[h] != null ? row[h] : "";
        const isNumeric = h === "Jaar" || h === "Week" || h === "Indexatie";
        const inputMode = isNumeric ? ' inputmode="decimal" pattern="[0-9.,]*"' : '';
        html += `<td><input type="text" class="form_input" value="${val}" data-row="${i}" data-col="${h}"${inputMode}></td>`;
      } else {
        html += `<td>${row[h]}</td>`;
      }
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  document.getElementById("indexatie-table").innerHTML = html;

  document.querySelectorAll("#indexatie-table input").forEach(input => {
    const col = input.dataset.col;
    const isNumeric = col === "Jaar" || col === "Week" || col === "Indexatie";

    if (isNumeric) {
      input.addEventListener("keypress", function (e) {
        const allowed = "0123456789.,";
        if (!allowed.includes(e.key)) {
          e.preventDefault();
        }
      });
    }

    input.addEventListener("change", function () {
      const r = parseInt(this.dataset.row);
      const c = this.dataset.col;
      let val = this.value;
      if (c === "Jaar" || c === "Week" || c === "Indexatie") {
        val = parseFloat(val.replace(",", ".")) || 0;
      }
      tableData[r][c] = val;
    });
  });
}

function toggleEdit() {
  editMode = !editMode;
  const btn = document.getElementById("toggle-edit");
  btn.innerHTML = editMode ? '<i class="fa-solid fa-x"></i> Sluiten' : '<i class="fa-solid fa-pen-to-square"></i> Indexatie';
  btn.classList.toggle("btn_edit_warning", editMode);
  btn.classList.toggle("btn_edit", !editMode);
  renderTable();
}

function getNextWeek() {
  let maxWeek = 0;
  tableData.forEach(row => {
    const week = parseInt(row.Week) || 0;
    if (week > maxWeek) maxWeek = week;
  });
  return maxWeek + 1;
}

function populateAddModal() {
  const namen = ["Geen index", "Producten", "Puin", "Transport"];
  const jaar = new Date().getFullYear();
  const week = getNextWeek();

  let html = '<table class="table table-bordered">';
  html += '<thead class="text-center"><tr><th>Naam</th><th>Jaar</th><th>Week</th><th>Indexatie(%)</th></tr></thead>';
  html += '<tbody>';
  namen.forEach(naam => {
    html += '<tr>';
    html += `<td>${naam}</td>`;
    html += `<td>${jaar}</td>`;
    html += `<td>${week}</td>`;
    html += `<td><input type="text" class="form_input text-center" value="0" data-naam="${naam}" data-jaar="${jaar}" data-week="${week}" inputmode="decimal" pattern="[0-9.,]*"></td>`;
    html += '</tr>';
  });
  html += '</tbody></table>';

  document.getElementById("newIndexationRow").innerHTML = html;

  document.querySelectorAll("#newIndexationRow input").forEach(input => {
    input.addEventListener("keypress", function (e) {
      const allowed = "0123456789.,";
      if (!allowed.includes(e.key)) {
        e.preventDefault();
      }
    });
  });
}

function newIndexationRow() {
  const inputs = document.querySelectorAll("#newIndexationRow input");
  inputs.forEach(input => {
    const naam = input.dataset.naam;
    const jaar = parseInt(input.dataset.jaar);
    const week = parseInt(input.dataset.week);
    const indexatie = parseFloat(input.value.replace(",", ".")) || 0;
    tableData.push({ Naam: naam, Jaar: jaar, Week: week, Indexatie: indexatie });
  });

  const modal = bootstrap.Modal.getInstance(document.getElementById('addIndexation'));
  if (modal) modal.hide();

  renderTable();

  document.getElementById("indexatie-table").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("DOMContentLoaded", function () {
  const addModal = document.getElementById("addIndexation");
  if (addModal) {
    addModal.addEventListener("show.bs.modal", populateAddModal);
  }
});

function getOutputJSON() {
  return JSON.stringify(tableData);
}

async function saveData() {
  // Close the modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('saveWarning'));
  if (modal) modal.hide();

  // Sync any open inputs back to tableData
  document.querySelectorAll("#indexatie-table input").forEach(input => {
    const r = parseInt(input.dataset.row);
    const c = input.dataset.col;
    let val = input.value;
    if (c === "Jaar" || c === "Week" || c === "Indexatie") {
      val = parseFloat(val.replace(",", ".")) || 0;
    }
    tableData[r][c] = val;
  });

  const json = getOutputJSON();
  console.log("Output JSON:", json);

  const url = "https://fme-gkb.fmecloud.com/api/IndexatieGrondbank/indexaties?DEBUG=NO";
  document.getElementById("indexatie-table").innerHTML = "<p>Data wordt verzonden...</p>";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "fmetoken token=c8fe3945982941066a1c4964d8a2ca5759e86c2b",
        "Content-Type": "application/json"
      },
      body: JSON.stringify( {json})
    });

    if (!res.ok) {
      throw new Error(`FME error: ${res.status}`);
    }
    
    const data = await res.json();
    resp = data;
    console.log("Response:", resp);
    getData();
  } catch (err) {
    document.getElementById("indexatie-table").innerHTML = `<p class="text-danger">Fout bij verzenden data: ${err.message}</p>`;
  }



}
