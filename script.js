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
      const chiave = `${beneficiario}->${s.paga}`;
      debiti[chiave] = (debiti[chiave] || 0) + quota;
    }
  }

  const debitori = {};

  for (const chiave in debiti) {
    const [da, a] = chiave.split("->");
    const quanto = debiti[chiave];

    if (!debitori[da]) debitori[da] = [];
    debitori[da].push({ a, quanto });
  }

  for (const deb in debitori) {
    const totale = debitori[deb].reduce((sum, t) => sum + t.quanto, 0);
    const li = document.createElement("li");
    li.textContent = `${deb} (debito totale: ${totale.toFixed(2)}€):`;
    transUI.appendChild(li);

    for (const t of debitori[deb]) {
      const sub = document.createElement("li");
      sub.textContent = `→ ${t.quanto.toFixed(2)}€ a ${t.a}`;
      sub.style.marginLeft = "20px";

      const giàPagato = pagamentiEffettuati.some(p => p.da === deb && p.a === t.a && p.quanto === t.quanto);

      const btn = document.createElement("button");
      btn.textContent = giàPagato ? "❌ Non pagato" : "✅ Pagato";
      btn.onclick = () => {
        if (giàPagato) {
          const i = pagamentiEffettuati.findIndex(p => p.da === deb && p.a === t.a && p.quanto === t.quanto);
          if (i !== -1) pagamentiEffettuati.splice(i, 1);
        } else {
          pagamentiEffettuati.push({ da: deb, a: t.a, quanto: t.quanto });
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
  const checkboxes = document.querySelectorAll("#persone input[type=checkbox]:not(#tutti)");
  const per = [];

  checkboxes.forEach(cb => {
    if (cb.checked) per.push(cb.value);
  });

  if (isNaN(importo) || per.length === 0) return;

  spese.push({ paga, importo, descrizione, per });

  document.getElementById("spesaForm").reset();
  aggiornaUI();
});

window.onload = () => {
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
    if (i < 3) col1.appendChild(label);
    else col2.appendChild(label);
  });

  const tutti = document.getElementById("tutti");
  tutti.addEventListener("change", function () {
    const checkboxes = document.querySelectorAll("#persone input[type=checkbox]:not(#tutti)");
    checkboxes.forEach(cb => cb.checked = tutti.checked);
  });

  // Suggerimenti descrizione con data corrente
  const oggi = new Date();
  const giorno = String(oggi.getDate()).padStart(2, "0");
  const mese = String(oggi.getMonth() + 1).padStart(2, "0");
  const anno = oggi.getFullYear();
  const data = `${giorno}/${mese}/${anno}`;
  const suggerimenti = [
    `Spesa ${data}`,
    `Colazione ${data}`,
    `Pranzo ${data}`,
    `Cena ${data}`,
    `Aperitivo ${data}`,
    `Gelato ${data}`
  ];
  const datalist = document.getElementById("suggerimenti");
  suggerimenti.forEach(text => {
    const option = document.createElement("option");
    option.value = text;
    datalist.appendChild(option);
  });

  aggiornaUI();
};