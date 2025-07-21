const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];
let spese = JSON.parse(localStorage.getItem("spese")) || [];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const saldiUI = document.getElementById("saldi");
  const transUI = document.getElementById("transazioni");
  lista.innerHTML = "";
  saldiUI.innerHTML = "";
  transUI.innerHTML = "";

  spese.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.chi} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);
  });

  // Calcolo saldi
  const saldo = {};
  persone.forEach(p => saldo[p] = 0);

  spese.forEach(s => {
    const quota = s.importo / s.per.length;
    saldo[s.chi] += s.importo;
    s.per.forEach(p => saldo[p] -= quota);
  });

  persone.forEach(p => {
    const li = document.createElement("li");
    const valore = Math.round(saldo[p] * 100) / 100;
    li.textContent = `${p}: ${valore > 0 ? "da ricevere" : valore < 0 ? "da dare" : "pari"} ${Math.abs(valore)}€`;
    saldiUI.appendChild(li);
  });

  // Transazioni suggerite
  const daDare = [];
  const daRicevere = [];
  for (const [p, val] of Object.entries(saldo)) {
    const v = Math.round(val * 100) / 100;
    if (v < 0) daDare.push([p, -v]);
    else if (v > 0) daRicevere.push([p, v]);
  }

  let i = 0, j = 0;
  while (i < daDare.length && j < daRicevere.length) {
    const [debitore, debito] = daDare[i];
    const [creditore, credito] = daRicevere[j];
    const importo = Math.min(debito, credito);
    const li = document.createElement("li");
    li.textContent = `${debitore} → ${creditore}: ${importo.toFixed(2)}€`;
    transUI.appendChild(li);
    daDare[i][1] -= importo;
    daRicevere[j][1] -= importo;
    if (daDare[i][1] < 0.01) i++;
    if (daRicevere[j][1] < 0.01) j++;
  }
}

function preparaForm() {
  const chi = document.getElementById("chi");
  const checkboxes = document.getElementById("checkboxes");
  persone.forEach(p => {
    chi.innerHTML += `<option value="${p}">${p}</option>`;
    checkboxes.innerHTML += `<input type="checkbox" name="per" value="${p}">${p}<br>`;
  });
}

document.getElementById("spesaForm").addEventListener("submit", e => {
  e.preventDefault();
  const chi = document.getElementById("chi").value;
  const importo = parseFloat(document.getElementById("importo").value);
  const descrizione = document.getElementById("descrizione").value;
  const per = Array.from(document.querySelectorAll("input[name=per]:checked")).map(c => c.value);
  if (!chi || !importo || per.length === 0) return alert("Completa tutti i campi");

  spese.push({ chi, importo, descrizione, per });
  localStorage.setItem("spese", JSON.stringify(spese));
  document.getElementById("spesaForm").reset();
  aggiornaUI();
});

preparaForm();
aggiornaUI();