const spese = JSON.parse(localStorage.getItem("spese")) || [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function salvaDati() {
  localStorage.setItem("spese", JSON.stringify(spese));
}

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  const riepilogo = document.getElementById("riepilogo");
  const sintesiNetta = document.getElementById("sintesiNetta");
  lista.innerHTML = "";
  transUI.innerHTML = "";
  riepilogo.innerHTML = "";
  sintesiNetta.innerHTML = "";

  const debiti = {};
  const pagatoDa = {};
  const ricevuto = {};

  for (const p of persone) {
    pagatoDa[p] = 0;
    ricevuto[p] = {};
    for (const alt of persone) {
      if (p !== alt) ricevuto[p][alt] = 0;
    }
  }

  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);

    const quota = s.importo / s.per.length;
    pagatoDa[s.paga] += s.importo;
    for (const beneficiario of s.per) {
      if (beneficiario !== s.paga) {
        ricevuto[beneficiario][s.paga] += quota;
      }
    }
  }

  // Operazioni da fare
  const debitiPerPersona = {};
  for (const da of persone) {
    let totaleDebito = 0;
    for (const a of persone) {
      if (da === a) continue;
      const quanto = ricevuto[da][a];
      if (quanto > 0) {
        if (!debitiPerPersona[da]) debitiPerPersona[da] = [];
        debitiPerPersona[da].push({ verso: a, importo: quanto });
        totaleDebito += quanto;
      }
    }
    if (debitiPerPersona[da]) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${da} (debito totale: ${totaleDebito.toFixed(2)}€):</strong><ul>${debitiPerPersona[da].map(t => `<li>→ ${t.importo.toFixed(2)}€ a ${t.verso}</li>`).join("")}</ul>`;
      transUI.appendChild(li);
    }
  }

  // Riepilogo spese per persona
  const intestazione = `<tr><th>Persona</th><th>Speso</th>${spese.map(s => `<th>${s.descrizione}</th>`).join("")}</tr>`;
  const righe = persone.map(p => {
    const spesePerPersona = spese.map(s => {
      const quota = s.per.includes(p) ? (s.importo / s.per.length) : 0;
      return `<td>${quota.toFixed(2)}</td>`;
    }).join("");
    return `<tr><td>${p}</td><td>${pagatoDa[p].toFixed(2)}</td>${spesePerPersona}</tr>`;
  });
  riepilogo.innerHTML = `<h3>Riepilogo spese</h3><table border="1">${intestazione}${righe.join("")}</table>`;

  // Sintesi debiti netti
  const netti = {};
  for (const da of persone) {
    for (const a of persone) {
      if (da === a) continue;
      const daA = ricevuto[da][a] || 0;
      const aDa = ricevuto[a][da] || 0;
      const netto = daA - aDa;
      if (netto > 0) {
        const chiave = `${da}->${a}`;
        netti[chiave] = netto;
      }
    }
  }

  const tabellaNetta = `<h3>Sintesi debiti netti</h3>
  <table border="1">
    <tr><th>Da</th><th>A</th><th>Importo Netto</th></tr>
    ${Object.entries(netti).map(([k, v]) => {
      const [da, a] = k.split("->");
      return `<tr><td>${da}</td><td>${a}</td><td>${v.toFixed(2)}€</td></tr>`;
    }).join("")}
  </table>`;
  sintesiNetta.innerHTML = tabellaNetta;
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("paga");
  persone.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });

  const col1 = document.getElementById("col1");
  const col2 = document.getElementById("col2");
  persone.forEach((p, i) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = p;
    label.appendChild(cb);
    label.append(" " + p);
    (i < 3 ? col1 : col2).appendChild(label);
  });

  const oggi = new Date();
  const data = `${String(oggi.getDate()).padStart(2, "0")}/${String(oggi.getMonth() + 1).padStart(2, "0")}/${oggi.getFullYear()}`;
  const suggerimenti = [
    `Spesa ${data}`, `Colazione ${data}`, `Pranzo ${data}`, `Cena ${data}`, `Aperitivo ${data}`, `Gelato ${data}`
  ];
  const datalist = document.getElementById("suggerimenti");
  suggerimenti.forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    datalist.appendChild(option);
  });

  document.getElementById("tutti").addEventListener("change", function () {
    const allCheckboxes = document.querySelectorAll("#col1 input[type=checkbox], #col2 input[type=checkbox]");
    allCheckboxes.forEach(cb => cb.checked = this.checked);
  });

  document.getElementById("spesaForm").addEventListener("submit", e => {
    e.preventDefault();
    const paga = document.getElementById("paga").value;
    const importo = parseFloat(document.getElementById("importo").value);
    const descrizione = document.getElementById("descrizione").value;
    const beneficiari = [...document.querySelectorAll("#col1 input[type=checkbox], #col2 input[type=checkbox]")]
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    if (!paga || isNaN(importo) || beneficiari.length === 0) return;
    spese.push({ paga, importo, descrizione, per: beneficiari });
    salvaDati();
    document.getElementById("spesaForm").reset();
    aggiornaUI();
  });

  aggiornaUI();
});