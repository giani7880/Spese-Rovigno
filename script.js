const spese = [];
const pagamentiEffettuati = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  lista.innerHTML = "";
  transUI.innerHTML = "";

  const debiti = {};

  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);

    const quota = s.importo / s.per.length;
    for (const beneficiario of s.per) {
      if (beneficiario === s.paga) continue;
      if (!debiti[beneficiario]) debiti[beneficiario] = {};
      if (!debiti[beneficiario][s.paga]) debiti[beneficiario][s.paga] = 0;
      debiti[beneficiario][s.paga] += quota;
    }
  }

  transUI.innerHTML = "";
  for (const debitore in debiti) {
    let totale = 0;
    for (const creditore in debiti[debitore]) {
      totale += debiti[debitore][creditore];
    }

    const li = document.createElement("li");
    li.textContent = `${debitore} (debito totale: ${totale.toFixed(2)}€):`;
    transUI.appendChild(li);

    for (const creditore in debiti[debitore]) {
      const quanto = debiti[debitore][creditore];
      const sub = document.createElement("li");
      sub.style.marginLeft = "20px";
      sub.textContent = `→ ${quanto.toFixed(2)}€ a ${creditore}`;

      const pagato = pagamentiEffettuati.some(p => p.da === debitore && p.a === creditore && p.quanto === quanto);

      const btn = document.createElement("button");
      btn.textContent = pagato ? "❌ Non pagato" : "✅ Pagato";
      btn.style.marginLeft = "10px";
      btn.onclick = () => {
        if (pagato) {
          const i = pagamentiEffettuati.findIndex(p => p.da === debitore && p.a === creditore && p.quanto === quanto);
          if (i !== -1) pagamentiEffettuati.splice(i, 1);
        } else {
          pagamentiEffettuati.push({ da: debitore, a: creditore, quanto });
        }
        aggiornaUI();
      };

      sub.appendChild(btn);
      transUI.appendChild(sub);
    }
  }
}

document.getElementById("spesaForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const paga = document.getElementById("paga").value;
  const importo = parseFloat(document.getElementById("importo").value);
  const descrizione = document.getElementById("descrizione").value;
  const checkboxes = document.querySelectorAll("#persone input[type=checkbox]");
  const per = [];
  checkboxes.forEach(cb => {
    if (cb.checked && cb.value !== "__all__") per.push(cb.value);
  });

  if (isNaN(importo) || per.length === 0) return;

  spese.push({ paga, importo, descrizione, per });
  document.getElementById("spesaForm").reset();
  aggiornaUI();
});

window.onload = () => {
  const div = document.getElementById("persone");

  // Aggiunge opzione "Tutti"
  const allLabel = document.createElement("label");
  const allCB = document.createElement("input");
  allCB.type = "checkbox";
  allCB.id = "selectAll";
  allCB.value = "__all__";
  allLabel.appendChild(allCB);
  allLabel.appendChild(document.createTextNode(" Tutti"));
  div.appendChild(allLabel);
  div.appendChild(document.createElement("br"));

  persone.forEach(p => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = p;
    cb.classList.add("personaCB");
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + p));
    div.appendChild(label);
    div.appendChild(document.createElement("br"));
  });

  document.getElementById("selectAll").addEventListener("change", function () {
    const all = this.checked;
    document.querySelectorAll(".personaCB").forEach(cb => cb.checked = all);
  });

  aggiornaUI();
};