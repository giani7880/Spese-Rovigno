const spese = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function salvaSpese() {
  localStorage.setItem("spese", JSON.stringify(spese));
}

function caricaSpese() {
  const dati = localStorage.getItem("spese");
  if (dati) {
    try {
      const parsed = JSON.parse(dati);
      if (Array.isArray(parsed)) {
        spese.splice(0, spese.length, ...parsed);
      }
    } catch {}
  }
}

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  const riepilogoDiv = document.getElementById("riepilogo");
  const sintesiDebitiDiv = document.getElementById("sintesiDebiti");

  lista.innerHTML = "";
  transUI.innerHTML = "";
  riepilogoDiv.innerHTML = "";
  sintesiDebitiDiv.innerHTML = "";

  // Mostra spese
  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo.toFixed(2)}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);
  }

  // Calcola debiti per singola transazione (da -> a)
  const debiti = {};
  for (const s of spese) {
    const quota = s.importo / s.per.length;
    for (const beneficiario of s.per) {
      if (beneficiario === s.paga) continue;
      const key = `${beneficiario}->${s.paga}`;
      debiti[key] = (debiti[key] || 0) + quota;
    }
  }

  // Mostra operazioni da fare dettagliate
  const debitiPerPersona = {}; // da -> {a: importo, ...}
  for (const key in debiti) {
    const [da, a] = key.split("->");
    const val = debiti[key];
    if (!debitiPerPersona[da]) debitiPerPersona[da] = {};
    debitiPerPersona[da][a] = val;
  }

  for (const da in debitiPerPersona) {
    const totaleDebito = Object.values(debitiPerPersona[da]).reduce((acc, v) => acc + v, 0);
    const li = document.createElement("li");
    li.textContent = `${da} (debito totale: ${totaleDebito.toFixed(2)}€):`;
    transUI.appendChild(li);

    for (const a in debitiPerPersona[da]) {
      const val = debitiPerPersona[da][a];
      const li2 = document.createElement("li");
      li2.textContent = `→ ${val.toFixed(2)}€ a ${a}`;
      transUI.appendChild(li2);
    }
  }

  // Riepilogo spese in tabella
  // Totale speso, quanto ha speso ciascuno, e quota per ogni spesa per persona
  const totaleSpese = spese.reduce((acc, s) => acc + s.importo, 0);
  const spesoPerPersona = {};
  persone.forEach(p => spesoPerPersona[p] = 0);
  spese.forEach(s => {
    spesoPerPersona[s.paga] += s.importo;
  });

  // Costruisco tabella riepilogo
  const tab = document.createElement("table");

  // Header
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  trHead.appendChild(document.createElement("th")); // Intestazione vuota in alto a sx
  persone.forEach(p => {
    const th = document.createElement("th");
    th.textContent = p;
    trHead.appendChild(th);
  });
  spese.forEach((s, idx) => {
    const th = document.createElement("th");
    th.textContent = `Spesa ${idx + 1}`;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  tab.appendChild(thead);

  // Corpo tabella
  const tbody = document.createElement("tbody");

  // Riga Totale speso da ciascuno
  const trTotale = document.createElement("tr");
  const tdTotaleLabel = document.createElement("td");
  tdTotaleLabel.textContent = "Totale speso";
  trTotale.appendChild(tdTotaleLabel);

  persone.forEach(p => {
    const td = document.createElement("td");
    td.textContent = spesoPerPersona[p].toFixed(2) + " €";
    trTotale.appendChild(td);
  });
  // Celle vuote per colonne spesa
  spese.forEach(() => {
    const td = document.createElement("td");
    td.textContent = "-";
    trTotale.appendChild(td);
  });
  tbody.appendChild(trTotale);

  // Riga per ogni persona: quanto spetta per ogni spesa
  persone.forEach(p => {
    const tr = document.createElement("tr");
    const tdPersona = document.createElement("td");
    tdPersona.textContent = p;
    tr.appendChild(tdPersona);

    // Celle vuote sotto Totale speso
    persone.forEach(() => {
      const td = document.createElement("td");
      td.textContent = "-";
      tr.appendChild(td);
    });

    // Celle importo quota per ogni spesa
    spese.forEach(s => {
      const td = document.createElement("td");
      if (s.per.includes(p)) {
        const quota = s.importo / s.per.length;
        td.textContent = quota.toFixed(2) + " €";
      } else {
        td.textContent = "-";
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  tab.appendChild(tbody);
  riepilogoDiv.appendChild(tab);

  // Sintesi debiti netti (calcolo differenza debiti)
  // Per ogni coppia A-B calcolo saldo netto e mostro solo saldo positivo
  // Costruisco matrice persona -> persona
  const saldo = {};
  persone.forEach(a => {
    saldo[a] = {};
    persone.forEach(b => {
      saldo[a][b] = 0;
    });
  });

  for (const key in debiti) {
    const [da, a] = key.split("->");
    saldo[da][a] = debiti[key];
  }

  // Calcolo saldo netto (A->B - B->A)
  const sintesiNetta = [];
  for (let i = 0; i < persone.length; i++) {
    for (let j = i + 1; j < persone.length; j++) {
      const a = persone[i];
      const b = persone[j];
      const saldoAB = saldo[a][b];
      const saldoBA = saldo[b][a];
      const diff = saldoAB - saldoBA;
      if (diff > 0.01) {
        sintesiNetta.push({ da: a, a: b, importo: diff });
      } else if (diff < -0.01) {
        sintesiNetta.push({ da: b, a: a, importo: -diff });
      }
    }
  }

  // Creo tabella sintesi debiti netti
  if (sintesiNetta.length === 0) {
    sintesiDebitiDiv.textContent = "Nessun debito netto tra le persone.";
  } else {
    const tabDebiti = document.createElement("table");
    const theadDebiti = document.createElement("thead");
    const trHeadDebiti = document.createElement("tr");
    ["Da", "Deve a", "Importo"].forEach(testo => {
      const th = document.createElement("th");
      th.textContent = testo;
      trHeadDebiti.appendChild(th);
    });
    theadDebiti.appendChild(trHeadDebiti);
    tabDebiti.appendChild(theadDebiti);

    const tbodyDebiti = document.createElement("tbody");
    sintesiNetta.forEach(d => {
      const tr = document.createElement("tr");
      const tdDa = document.createElement("td");
      tdDa.textContent = d.da;
      const tdA = document.createElement("td");
      tdA.textContent = d.a;
      const tdImp = document.createElement("td");
      tdImp.textContent = d.importo.toFixed(2) + " €";

      tr.appendChild(tdDa);
      tr.appendChild(tdA);
      tr.appendChild(tdImp);
      tbodyDebiti.appendChild(tr);
    });
    tabDebiti.appendChild(tbodyDebiti);

    sintesiDebitiDiv.appendChild(tabDebiti);
  }
}

// Popola dropdown e checkbox persone
function setupPersoneUI() {
  const selectPaga = document.getElementById("paga");
  selectPaga.innerHTML = "";
  persone.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    selectPaga.appendChild(option);
  });

  const col1 = document.getElementById("col1");
  const col2 = document.getElementById("col2");
  col1.innerHTML = "";
  col2.innerHTML = "";

  persone.forEach((p, idx) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "cbPer";
    cb.value = p;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + p));
    if (idx < persone.length / 2) {
      col1.appendChild(label);
      col1.appendChild(document.createElement("br"));
    } else {
      col2.appendChild(label);
      col2.appendChild(document.createElement("br"));
    }
  });

  // Checkbox tutti
  const tutti = document.getElementById("tutti");
  tutti.checked = false;
  tutti.addEventListener("change", () => {
    document.querySelectorAll(".cbPer").forEach(cb => {
      cb.checked = tutti.checked;
    });
  });
}

function aggiornaSuggerimenti() {
  const descrInput = document.getElementById("descrizione");
  const datalist = document.getElementById("suggerimenti");
  const descrizioni = [...new Set(spese.map(s => s.descrizione))];
  datalist.innerHTML = "";
  descrizioni.forEach(d => {
    const option = document.createElement("option");
    option.value = d;
    datalist.appendChild(option);
  });
}

document.getElementById("spesaForm").addEventListener("submit", e => {
  e.preventDefault();
  const paga = document.getElementById("paga").value;
  const importo = parseFloat(document.getElementById("importo").value);
  const descrizione = document.getElementById("descrizione").value.trim();
  const per = Array.from(document.querySelectorAll(".cbPer"))
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  if (!paga || isNaN(importo) || importo <= 0 || per.length === 0 || descrizione === "") {
    alert("Compila correttamente tutti i campi e seleziona almeno una persona per la spesa.");
    return;
  }

  spese.push({ paga, importo, descrizione, per });
  salvaSpese();
  aggiornaSuggerimenti();
  aggiornaUI();

  // Reset form
  document.getElementById("spesaForm").reset();
  document.getElementById("tutti").checked = false;
});

document.addEventListener("DOMContentLoaded", () => {
  setupPersoneUI();
  caricaSpese();
  aggiornaSuggerimenti();
  aggiornaUI();
});

// Exporta spese in JSON scaricabile
document.getElementById("btnEsporta").addEventListener("click", () => {
  const datiJson = JSON.stringify(spese, null, 2);
  const blob = new Blob([datiJson], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "spese.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Importa spese da file JSON
document.getElementById("btnImporta").addEventListener("click", () => {
  document.getElementById("inputImporta").click();
});

document.getElementById("inputImporta").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    try {
      const datiImportati = JSON.parse(event.target.result);

      if (!Array.isArray(datiImportati)) {
        alert("File JSON non valido");
        return;
      }

      for (const spesa of datiImportati) {
        if (!spesa.paga || !spesa.importo || !spesa.descrizione || !Array.isArray(spesa.per)) {
          alert("File JSON contiene dati malformati");
          return;
        }
      }

      spese.push(...datiImportati);
      salvaSpese();
      aggiornaSuggerimenti();
      aggiornaUI();
      alert("Spese importate correttamente!");
    } catch {
      alert("Errore nella lettura del file JSON");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});