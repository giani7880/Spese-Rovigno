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

    // ** Tabella riepilogo spese: versione invariata **
    const tab = document.createElement("table");
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    trHead.appendChild(document.createElement("th")); // prima cella vuota
    persone.forEach(p => {
      const th = document.createElement("th");
      th.textContent = p;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    tab.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Totale speso per persona
    const totalePerPersona = {};
    persone.forEach(p => totalePerPersona[p] = 0);
    spese.forEach(s => { totalePerPersona[s.paga] += s.importo; });

    // Riga totale speso
    const trTotale = document.createElement("tr");
    const tdTotale = document.createElement("td");
    tdTotale.textContent = "Totale speso";
    trTotale.appendChild(tdTotale);
    persone.forEach(p => {
      const td = document.createElement("td");
      td.textContent = totalePerPersona[p].toFixed(2) + "€";
      trTotale.appendChild(td);
    });
    tbody.appendChild(trTotale);

    // Quota spesa per ogni persona e ogni spesa
    persone.forEach(p => {
      const tr = document.createElement("tr");
      const tdNome = document.createElement("td");
      tdNome.textContent = p;
      tr.appendChild(tdNome);

      persone.forEach(() => {
        // celle vuote per allineamento con intestazione
        const tdEmpty = document.createElement("td");
        tr.appendChild(tdEmpty);
      });

      tbody.appendChild(tr);
    });

    tab.appendChild(tbody);
    riepilogoDiv.appendChild(tab);

    // Sintesi debiti netti (come prima)
    const saldo = {};
    persone.forEach(p1 => {
      saldo[p1] = {};
      persone.forEach(p2 => saldo[p1][p2] = 0);
    });

    for (const key in debiti) {
      const [da, a] = key.split("->");
      saldo[da][a] += debiti[key];
    }

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

    if (debitiNetti.length === 0) {
      sintesiDebitiDiv.textContent = "Tutti i debiti sono saldati.";
    } else {
      const tabSintesi = document.createElement("table");
      const trHeadSintesi = document.createElement("tr");
      ["Chi deve", "A chi", "Importo (€)"].forEach(testo => {
        const th = document.createElement("th");
        th.textContent = testo;
        trHeadSintesi.appendChild(th);
      });
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
    const tutti = document.getElementById("tutti").checked;
    const checkboxPersone = Array.from(document.querySelectorAll(".cbPer"));
    const per = tutti ? [...persone] : checkboxPersone.filter(cb => cb.checked).map(cb => cb.value);

    if (!paga || isNaN(importo) || importo <= 0 || per.length === 0 || descrizione === "") {
      alert("Compila tutti i campi correttamente.");
      return;
    }

    spese.push({ paga, importo, descrizione, per });
    salvaSpese();
    aggiornaSuggerimenti();
    aggiornaUI();

    // pulizia form
    document.getElementById("importo").value = "";
    document.getElementById("descrizione").value = "";
    document.getElementById("tutti").checked = false;
    checkboxPersone.forEach(cb => cb.checked = false);
  }

  function esportaSpese() {
    const dati = JSON.stringify(spese, null, 2);
    const blob = new Blob([dati], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "spese.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importaSpese(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const dati = JSON.parse(e.target.result);
        if (!Array.isArray(dati)) throw new Error("Formato non valido");
        spese.splice(0, spese.length, ...dati);
        salvaSpese();
        aggiornaSuggerimenti();
        aggiornaUI();
        alert("Importazione completata.");
      } catch {
        alert("File JSON non valido.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  // Event listeners
  document.getElementById("btnAggiungi").addEventListener("click", aggiungiSpesa);
  document.getElementById("btnEsporta").addEventListener("click", esportaSpese);
  document.getElementById("btnImporta").addEventListener("click", () => document.getElementById("inputImporta").click());
  document.getElementById("inputImporta").addEventListener("change", importaSpese);

  // init
  setupPersoneUI();
  caricaSpese();
  aggiornaSuggerimenti();
  aggiornaUI();
})();