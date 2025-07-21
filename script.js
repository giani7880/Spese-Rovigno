const spese = [];
const pagamentiEffettuati = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];
const debitiDettagliati = {};

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const saldiUI = document.getElementById("saldi");
  const transUI = document.getElementById("transazioni");

  lista.innerHTML = "";
  saldiUI.innerHTML = "";
  transUI.innerHTML = "";
  Object.keys(debitiDettagliati).forEach(k => delete debitiDettagliati[k]);

  const saldo = {};
  persone.forEach(p => saldo[p] = 0);

  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);

    const quota = s.importo / s.per.length;
    saldo[s.paga] += s.importo;

    for (const p of s.per) {
      if (p !== s.paga) {
        saldo[p] -= quota;

        const key = `${p}->${s.paga}`;
        if (!debitiDettagliati[key]) debitiDettagliati[key] = 0;
        debitiDettagliati[key] += quota;
      }
    }
  }

  for (const [p, val] of Object.entries(saldo)) {
    const li = document.createElement("li");
    const arrotondato = Math.round(val * 100) / 100;
    li.textContent = `${p}: ${arrotondato >= 0 ? "da ricevere" : "da dare"} ${Math.abs(arrotondato).toFixed(2)}€`;
    saldiUI.appendChild(li);
  }

  const debitori = {};

  for (const key in debitiDettagliati) {
    const [da, a] = key.split("->");
    const quanto = debitiDettagliati[key];

    if (!debitori[da]) debitori[da] = [];
    debitori[da].push({ a, quanto });
  }

  for (const [deb, dettagli] of Object.entries(debitori)) {
    const li = document.createElement("li");
    const totale = dettagli.reduce((acc, cur) => acc + cur.quanto, 0);
    li.textContent = `${deb} (debito totale: ${totale.toFixed(2)}€):`;
    transUI.appendChild(li);

    dettagli.forEach(t => {
      const sub = document.createElement("li");
      sub.style.marginLeft = "20px";
      sub.textContent = `→ ${t.quanto.toFixed(2)}€ a ${t.a}`;

      const giàPagato = pagamentiEffettuati.some(p => p.da === deb && p.a === t.a && p.quanto === t.quanto);
      const btn = document.createElement("button");
      btn.textContent = giàPagato ? "❌ Non pagato" : "✅ Pagato";
      btn.onclick = () => {
        const i = pagamentiEffettuati.findIndex(p => p.da === deb && p.a === t.a && p.quanto === t.quanto);
        if (i !== -1) pagamentiEffettuati.splice(i, 1);
        else pagamentiEffettuati.push({ da: deb, a: t.a, quanto: t.quanto });
        aggiornaUI();
      };
      sub.appendChild(btn);
      transUI.appendChild(sub);
    });
  }
}

document.getElementById("spesaForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const paga = document.getElementById("paga").value;
  const importo = parseFloat(document.getElementById("importo").value);
  const descrizione = document.getElementById("descrizione").value;
  const checkboxes = document.querySelectorAll("#persone input[type=checkbox]");
  const per = [];
  checkboxes.forEach(cb => { if (cb.checked) per.push(cb.value); });

  if (isNaN(importo) || per.length === 0) return;

  spese.push({ paga, importo, descrizione, per });
  document.getElementById("spesaForm").reset();
  aggiornaUI();
});

window.onload = () => {
  const div = document.getElementById("persone");
  persone.forEach(p => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = p;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + p));
    div.appendChild(label);
    div.appendChild(document.createElement("br"));
  });
  aggiornaUI();
};