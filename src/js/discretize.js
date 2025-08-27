// Récupération des données depuis le localStorage
const tfData = JSON.parse(localStorage.getItem('tf'));

if (!tfData) {
    // Redirection si aucune donnée n'est trouvée
    window.location.href = 'input.html';
}

// Éléments DOM
const tfInputEl = document.getElementById("tfInput");
const recurrentEl = document.getElementById("recurrent");
const statespaceEl = document.getElementById("statespace");
const statespaceEqEl = document.getElementById("statespaceEq");
const inputSelect = document.getElementById("inputSelect");
const customInputContainer = document.getElementById("customInputContainer");
const customInput = document.getElementById("customInput");
const sinusParams = document.getElementById("sinusParams");
const form = document.getElementById("inputForm");

// Afficher la fonction de transfert
function displayTransferFunction() {
    const num = tfData.numerator.coefficients;
    const den = tfData.denominator.coefficients;
    
    // Formater pour l'affichage LaTeX
    const formatPolynomial = (coeffs, variable = 'z') => {
        let terms = [];
        for (let i = 0; i < coeffs.length; i++) {
            const power = coeffs.length - 1 - i;
            const coeff = coeffs[i];
            
            if (coeff === 0) continue;
            
            let term = '';
            if (power === 0) {
                term = coeff.toString();
            } else {
                const coeffStr = coeff === 1 ? '' : coeff === -1 ? '-' : coeff.toString();
                term = `${coeffStr}${variable}${power > 1 ? `^{${power}}` : ''}`;
            }
            terms.push(term);
        }
        return terms.join(' + ').replace(/\+\s\-/g, '- ');
    };

    const numeratorStr = formatPolynomial(num);
    const denominatorStr = formatPolynomial(den);
    
    tfInputEl.innerHTML = `
        <div class="text-sm text-slate-400 mb-2">Fonction de transfert discrète</div>
        <div>$$ G(z) = \\frac{${numeratorStr}}{${denominatorStr}} $$</div>
    `;
}

// Afficher l'équation récurrente
function displayRecurrentEquation() {
    const a = tfData.denominator.coefficients;
    const b = tfData.numerator.coefficients;
    
    let equation = 'y[k] = ';
    let terms = [];
    
    // Termes de y (sortie)
    for (let i = 1; i < a.length; i++) {
        if (a[i] !== 0) {
            const sign = a[i] > 0 ? '-' : '+';
            terms.push(`${sign} ${Math.abs(a[i])} \\, y[k-${i}]`);
        }
    }
    
    // Termes de u (entrée)
    for (let i = 0; i < b.length; i++) {
        if (b[i] !== 0) {
            const sign = b[i] > 0 ? '+' : '-';
            terms.push(`${sign} ${Math.abs(b[i])} \\, u[k-${i}]`);
        }
    }
    
    equation += terms.join(' ');
    
    recurrentEl.innerHTML = `
        <div class="text-sm text-slate-400 mb-2">Équation aux différences</div>
        <div>$$ ${equation} $$</div>
    `;
}

// Afficher la représentation d'état
function displayStateSpace() {
    const a = tfData.denominator.coefficients;
    const b = tfData.numerator.coefficients;
    const n = a.length - 1;
    
    // Matrice A (matrice d'état)
    let A = [];
    for (let i = 0; i < n; i++) {
        A[i] = new Array(n).fill(0);
        if (i < n - 1) {
            A[i][i + 1] = 1;
        } else {
            for (let j = 0; j < n; j++) {
                A[i][j] = -a[j + 1];
            }
        }
    }
    
    // Vecteur B (commande)
    let B = new Array(n).fill(0);
    B[n - 1] = 1;
    
    // Vecteur C (observation)
    let C = [];
    for (let i = 1; i < b.length; i++) {
        C.push(b[i] - b[0] * a[i]);
    }
    // Compléter si nécessaire
    while (C.length < n) {
        C.push(0);
    }
    
    // Matrice D (directe)
    const D = b[0];
    
    // Formater les matrices pour LaTeX
    const formatMatrix = (matrix) => {
        if (Array.isArray(matrix[0])) {
            return `\\begin{bmatrix} ${matrix.map(row => row.join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;
        } else {
            return `\\begin{bmatrix} ${matrix.join(' \\\\ ')} \\end{bmatrix}`;
        }
    };
    
    statespaceEl.innerHTML = `
        <div class="text-sm text-slate-400 mb-2">Forme canonique de commande</div>
        <div>$$ A = ${formatMatrix(A)} $$</div>
        <div>$$ B = ${formatMatrix(B)} $$</div>
        <div>$$ C = ${formatMatrix(C)} $$</div>
        <div>$$ D = ${D} $$</div>
    `;
    
    statespaceEqEl.innerHTML = `
        <div class="text-sm text-slate-400 mb-2">Équations d'état</div>
        <div>$$ x[k+1] = A \\, x[k] + B \\, u[k] $$</div>
        <div>$$ y[k] = C \\, x[k] + D \\, u[k] $$</div>
    `;
}

// Gestion des changements de type d'entrée
inputSelect.addEventListener('change', () => {
    customInputContainer.classList.add('hidden');
    sinusParams.classList.add('hidden');
    
    if (inputSelect.value === 'custom') {
        customInputContainer.classList.remove('hidden');
    } else if (inputSelect.value === 'sinus') {
        sinusParams.classList.remove('hidden');
    }
});

// Gestion de la soumission du formulaire
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let inputType = inputSelect.value;
    let inputParams = {};
    
    if (inputType === 'custom') {
        inputParams = { expression: customInput.value };
    } else if (inputType === 'sinus') {
        inputParams = {
            amplitude: parseFloat(document.getElementById('sinusAmplitude').value),
            frequency: parseFloat(document.getElementById('sinusFrequency').value)
        };
    }
    
    // Stocker les paramètres d'entrée
    localStorage.setItem('inputType', inputType);
    localStorage.setItem('inputParams', JSON.stringify(inputParams));
    
    // Rediriger vers la page de visualisation
    window.location.href = 'output.html';
});

// Initialisation
displayTransferFunction();
displayRecurrentEquation();
displayStateSpace();

// Rendu des formules mathématiques
setTimeout(() => {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ],
            throwOnError: false
        });
    }
}, 100);