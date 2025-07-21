(() => {
  const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];
  const spese = [];

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

    // Checkbox "tutti"
    const tutti = document.getElementById("tutti");
    tutti.checked = false;
    tutti.addEventListener("change", () => {
      document.querySelectorAll(".cbPer").forEach(cb => cb.checked = tutti.checked);
    });
  }

  function aggiornaSuggerimenti() {
    const datalist = document.getElementById("suggerimenti");
    const descrizioni = [...new Set(spese.map(s => s.descrizione))];
    datalist.innerHTML = "";
    descrizioni.forEach(d => {
      const option = document.createElement("option");
      option.value = d;
      datalist.appendChild(option);
    });
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

    // Lista spese
    for (const s of spese) {
      const li = document.createElement("li");
      li.textContent = `${s.paga} ha pagato ${s.importo.toFixed(2)}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
      lista.appendChild(li);
    }

    // Calcolo debiti (da->a)
    const debiti = {};
    for (const s of spese) {
      const quota = s.importo / s.per.length;
      for (const beneficiario of s.per) {
        if (beneficiario === s.paga) continue;
        const key = `${beneficiario}->${s.paga}`;
        debiti[key] = (debiti[key] || 0) + quota;
      }
    }

    // Operazioni da fare dettagliate
    const debitiPerPersona = {};
    for (const key in debiti) {
      const [da, a] = key.split("->");
      if (!debitiPerPersona[da]) debitiPerPersona[da] = {};
      debitiPerPersona[da][a] = debiti[key];
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
    const totaleSpese = spese.reduce((acc, s) => acc + s.importo, 0);
    const spesoPerPersona = {};
    persone.forEach(p => spesoPerPersona[p] = 0);
    spese.forEach(s => { spesoPerPersona[s.paga] += s.importo; });

    const tab = document.createElement("table");
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    trHead.appendChild(document.createElement("th")); // cella vuota in alto a sx
    persone.forEach(p => {
      const th = document.createElement("th");
      th.textContent = p;
      trHead.appendChild(th);
    });
    spese.forEach((_, idx) => {
      const th = document.createElement("th");
      th.textContent = `Spesa ${idx + 1}`;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    tab.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Riga Totale speso
    const trTotale = document.createElement("tr");
    const tdTotaleLabel = document.createElement("td");
    tdTotaleLabel.textContent = "Totale speso";
    trTotale.appendChild(tdTotaleLabel);
    persone.forEach(p => {
      const td = document.createElement("td");
      td.textContent = spesoPerPersona[p].toFixed(2) + "€";
      trTotale.appendChild(td);
    });
    // per ogni spesa cella vuota
    spese.forEach(_ => {
      const td = document.createElement("td");
      td.textContent = "";
      trTotale.appendChild(td);
    });
    tbody.appendChild(trTotale);

    // Per ogni persona: quanto deve per ogni spesa (quota)
    persone.forEach(p => {
      const tr = document.createElement("tr");
      const tdNome = document.createElement("td");
      tdNome.textContent = p;
      tr.appendChild(tdNome);

      // colonna speso (vuota per allineare)
      persone.forEach(_ => {
        const td = document.createElement("td");
        td.textContent = "";
        tr.appendChild(td);
      });

      // quota di questa persona per ogni spesa
      spese.forEach(s => {
        const td = document.createElement("td");
        if (s.per.includes(p)) {
          const quota = s.importo / s.per.length;
          td.textContent = quota.toFixed(2) + "€";
        } else {
          td.textContent = "-";
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    tab.appendChild(tbody);
    riepilogoDiv.appendChild(tab);

    // Sintesi debiti netti (semplificazione)
    // Calcoliamo i debiti netti: per ogni coppia di persone si sommano i debiti reciproci e si lascia solo il saldo netto
    const saldo = {}; // saldo[p1][p2] = quanto p1 deve a p2 (positivo)

    persone.forEach(p1 => {
      saldo[p1] = {};
      persone.forEach(p2 => saldo[p1][p2] = 0);
    });

    for (const key in debiti) {
      const [da, a] = key.split("->");
      saldo[da][a] += debiti[key];
    }

    // Calcoliamo saldo netto per coppie
    const debitiNetti = [];

    for (let i = 0; i < persone.length; i++) {
      for (let j = i + 1; j < persone.length; j++) {
        const p1 = persone[i];
        const p2 = persone[j];
        const diff = saldo[p1][p2] - saldo[p2][p1];
        if (diff > 0.01) {
          debitiNetti.push({ da: p1, a: p2, importo: diff });
        } else if (diff < -0.01) {
          debitiNetti.push({ da: p2, a: p1, importo: -diff });
        }
      }
    }

    // Costruiamo tabella sintesi debiti netti
    if (debitiNetti.length === 0) {
      sintesiDebitiDiv.textContent = "Tutti i debiti sono saldati.";
    } else {
      const tabSintesi = document.createElement("table");
      const th1 = document.createElement("th");
      th1.textContent = "Chi deve";
      const th2 = document.createElement("th");
      th2.textContent = "A chi";
      const th3 = document.createElement("th");
      th3.textContent = "Importo (€)";
      const trHeadSintesi = document.createElement("tr");
      trHeadSintesi.appendChild(th1);
      trHeadSintesi.appendChild(th2);
      trHeadSintesi.appendChild(th3);
      tabSintesi.appendChild(trHeadSintesi);

      debitiNetti.forEach(d => {
        const tr = document.createElement("tr");
        const tdDa = document.createElement("td");
        tdDa.textContent = d.da;
        const tdA = document.createElement("td");
        tdA.textContent = d.a;
        const tdImp = document.createElement("td");
        tdImp.textContent = d.importo.toFixed(2);
        tr.appendChild(tdDa);
        tr.appendChild(tdA);
        tr.appendChild(tdImp);
        tabSintesi.appendChild(tr);
      });

      sintesiDebitiDiv.appendChild(tabSintesi);
    }
  }

  function aggiungiSpesa(e) {
    e.preventDefault();
    const paga = document.getElementById("paga").value;
    const importo = parseFloat(document.getElementById("importo").value);
    const descrizione = document.getElementById("descrizione").value.trim();
    if (isNaN(importo) || importo <= 0) {
      alert("Inserisci un importo valido.");
      return;
    }
    if (!descrizione) {
      alert("Inserisci una descrizione.");
      return;
    }
    const per = Array.from(document.querySelectorAll(".cbPer:checked")).map(cb => cb.value);
    if (per.length === 0) {
      alert("Seleziona almeno una persona per la spesa.");
      return;
    }
    spese.push({ paga, importo, descrizione, per });
    salvaSpese();
    aggiornaSuggerimenti();
    aggiornaUI();

    // Reset form
    document.getElementById("spesaForm").reset();
    document.getElementById("tutti").checked = false;
  }

  function esportaSpese() {
    const dati = JSON.stringify(spese, null, 2);
    const blob = new Blob([dati], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spese.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importaSpese(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const datiImportati = JSON.parse(event.target.result);
        if (Array.isArray(datiImportati)) {
          spese.splice(0, spese.length, ...datiImportati);
          salvaSpese();
          aggiornaSuggerimenti();
          aggiornaUI();
          alert("Spese importate correttamente.");
        } else {
          alert("Formato file non valido.");
        }
      } catch {
        alert("Errore nel parsing del file.");
      }
      document.getElementById("inputImporta").value = "";
    };
    reader.readAsText(file);
  }

  document.getElementById("spesaForm").addEventListener("submit", aggiungiSpesa);
  document.getElementById("btnEsporta").addEventListener("click", esportaSpese);
  document.getElementById("btnImporta").addEventListener("click", () => document.getElementById("inputImporta").click());
  document.getElementById("inputImporta").addEventListener("change", importaSpese);

  // inizializzazione
  setupPersoneUI();
  caricaSpese();
  aggiornaSuggerimenti();
  aggiornaUI();
})();