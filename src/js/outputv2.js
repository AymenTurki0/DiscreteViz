// --- Input type from localStorage ---
const inputType = localStorage.getItem("inputType") || "step";
document.getElementById("inputName").textContent = inputType;

// --- Transfer function data ---
const tfData = JSON.parse(localStorage.getItem("tf"));
if(!tfData){
    alert("Aucune fonction de transfert trouvée. Retour à la page d'entrée.");
    window.location.href = "input.html";
}

// --- Parse polynomial string into coeff array ---
function parsePolynomial(polyStr){
    const cleanStr = polyStr.replace(/\s+/g,'');
    const terms = cleanStr.split(/(?=[+-])/).filter(term => term !== '');
    let maxDegree = 0;
    for(const term of terms){
        if(term.includes('z^')) {
            const match = term.match(/z\^(\d+)/);
            if(match) maxDegree = Math.max(maxDegree, parseInt(match[1]));
        } else if(term.includes('z')) {
            maxDegree = Math.max(maxDegree,1);
        }
    }
    const coeffs = Array(maxDegree+1).fill(0);
    for(const term of terms){
        if(term==='') continue;
        let coeff, degree;
        if(term.includes('z^')){
            const parts = term.split('z^');
            coeff = parts[0]===''||parts[0]==='+' ? 1 : parts[0]==='-'?-1:parseFloat(parts[0]);
            degree = parseInt(parts[1]);
        } else if(term.includes('z')){
            const parts = term.split('z');
            coeff = parts[0]===''||parts[0]==='+' ? 1 : parts[0]==='-'?-1:parseFloat(parts[0]);
            degree = 1;
        } else {
            coeff = parseFloat(term);
            degree = 0;
        }
        coeffs[maxDegree-degree] = coeff;
    }
    return coeffs;
}

// --- Coefficients from G(z) ---
const a = parsePolynomial(tfData.denominator); // Den
const b = parsePolynomial(tfData.numerator);   // Num

// --- Input signal ---
// --- REALISTIC Input signal ---
function generateInput(n, type) {
    const u = [];
    
    // Get parameters from localStorage with defaults
    const amplitude = parseFloat(localStorage.getItem("inputAmplitude") || "1");
    const saturationPoint = parseInt(localStorage.getItem("saturationPoint") || "50");
    const noiseLevel = parseFloat(localStorage.getItem("noiseLevel") || "0.05");
    
    // Helper function to add realistic noise
    function addNoise(value, noiseLevel) {
        return value + (Math.random() - 0.5) * 2 * noiseLevel;
    }
    
    for (let k = 0; k < n; k++) {
        switch (type) {
            case "step":
                // Step that rises gradually instead of instantly
                if (k < n/20) {
                    // Gradual rise (5% of total time)
                    u.push(amplitude * (k / (n/20)));
                } else {
                    u.push(amplitude);
                }
                break;
                
            case "ramp":
                // Ramp that saturates at a certain point
                if (k < saturationPoint) {
                    u.push(amplitude * k);
                } else {
                    u.push(amplitude * saturationPoint); // Stay constant after saturation
                }
                break;
                
            case "impulse":
                // More realistic impulse with some width
                if (k === 0) {
                    u.push(amplitude);
                } else if (k < 5) {
                    // Small decaying tail
                    u.push(amplitude * Math.exp(-k));
                } else {
                    u.push(0);
                }
                break;
                
            case "sinus":
                // Sinusoidal with possible amplitude modulation
                const freq = 2 * Math.PI * k / n;
                u.push(amplitude * Math.sin(freq));
                break;
                
            case "noisy_step":
                // Step with noise
                const stepVal = k > n/10 ? amplitude : 0;
                u.push(addNoise(stepVal, noiseLevel));
                break;
                
            case "noisy_ramp":
                // Ramp with noise that saturates
                const rampVal = k < saturationPoint ? amplitude * k : amplitude * saturationPoint;
                u.push(addNoise(rampVal, noiseLevel));
                break;
                
            default:
                u.push(1);
                break;
        }
    }
    return u;
}

// --- Simulate system ---
function simulateSystem(u,a,b){
    const y=[];
    for(let k=0;k<u.length;k++){
        let yk=0;
        for(let i=1;i<a.length;i++){
            yk -= (y[k-i]||0)*a[i];
        }
        for(let i=0;i<b.length;i++){
            yk += (u[k-i]||0)*b[i];
        }
        y.push(yk);
    }
    return y;
}

// --- Fit ARMA model ---
function fitARMA(y,u,p=2,q=1){
    const N=y.length;
    const X=[], Y=[];
    for(let k=Math.max(p,q); k<N; k++){
        const row=[];
        for(let i=1;i<=p;i++) row.push(-y[k-i]);
        for(let j=0;j<=q;j++) row.push(u[k-j]);
        X.push(row); Y.push(y[k]);
    }

    if(X.length===0) return {a:Array(p).fill(0), b:Array(q+1).fill(0), yModel:Array(N).fill(0)};

    const Xt=transpose(X);
    const XtX=multiply(Xt,X);
    const XtXinv=invertMatrix(XtX);
    const XtY=multiply(Xt,Y.map(v=>[v]));
    const theta=multiply(XtXinv,XtY).map(v=>v[0]);

    const ar=theta.slice(0,p).map(v=>(isNaN(v)||!isFinite(v))?0:v);
    const ma=theta.slice(p).map(v=>(isNaN(v)||!isFinite(v))?0:v);

    const yModel=[];
    for(let k=0;k<N;k++){
        let yk=0;
        for(let i=0;i<p;i++) if(k-i-1>=0) yk -= ar[i]*yModel[k-i-1];
        for(let i=0;i<ma.length;i++) if(k-i>=0) yk += ma[i]*u[k-i];
        yModel.push(yk);
    }
    return {a:ar,b:ma,yModel};
}

// --- Linear algebra ---
function transpose(A){return A[0].map((_,i)=>A.map(r=>r[i]));}
function multiply(A,B){
    const res=Array(A.length).fill(0).map(()=>Array(B[0].length).fill(0));
    for(let i=0;i<A.length;i++)
        for(let j=0;j<B[0].length;j++)
            for(let k=0;k<B.length;k++)
                res[i][j]+=A[i][k]*B[k][j];
    return res;
}
function invertMatrix(M){
    const n=M.length;
    const I=M.map((r,i)=>r.map((_,j)=>i===j?1:0));
    const A=M.map(r=>[...r]);
    for(let i=0;i<n;i++){
        if(Math.abs(A[i][i])<1e-12) A[i][i]=1e-12;
        let diag=A[i][i];
        for(let j=0;j<n;j++){A[i][j]/=diag; I[i][j]/=diag;}
        for(let k=0;k<n;k++){
            if(k===i) continue;
            const f=A[k][i];
            for(let j=0;j<n;j++){A[k][j]-=f*A[i][j]; I[k][j]-=f*I[i][j];}
        }
    }
    return I;
}

// =====================================
// FIXED HELPER FUNCTIONS (NO DUPLICATES!)
// =====================================

// SINGLE formatNumber function
function formatNumber(num) {
    if (Math.abs(num) < 1e-10) return '0';
    if (Number.isInteger(num)) return num.toString();
    const formatted = num.toFixed(4).replace(/\.?0+$/, '');
    return formatted === '-0' ? '0' : formatted;
}

// SINGLE formatPolynomial function
function formatPolynomial(coeffs, variable = 'z', descending = true) {
    if (coeffs.length === 0) return '0';
    
    let poly = '';
    const order = coeffs.length - 1;
    
    for (let i = 0; i < coeffs.length; i++) {
        const coeff = coeffs[i];
        if (Math.abs(coeff) < 1e-10) continue;
        
        const power = descending ? (order - i) : i;
        const absCoeff = Math.abs(coeff);
        const isOne = Math.abs(absCoeff - 1) < 1e-10;
        let term = '';
        
        if (power === 0) {
            term = formatNumber(absCoeff);
        } else if (power === 1) {
            term = isOne ? variable : `${formatNumber(absCoeff)}${variable}`;
        } else {
            term = isOne ? `${variable}^${power}` : `${formatNumber(absCoeff)}${variable}^${power}`;
        }
        
        if (poly === '') {
            poly = coeff < 0 ? `-${term}` : term;
        } else {
            const sign = coeff >= 0 ? ' + ' : ' - ';
            poly += `${sign}${term}`;
        }
    }
    
    return poly || '0';
}

// FIXED zDomainEq function
function zDomainEq(ar, ma) {
    if (!ar || !ma || ar.length === 0 || ma.length === 0) {
        return '$$ Y(z) = 0 $$';
    }
    
    try {
        // Build denominator coefficients: z^n - ar[0]*z^(n-1) - ar[1]*z^(n-2) - ...
        // Since AR coefficients are negated in time domain display, we negate them here for Z-domain
        const denCoeffs = [1, ...ar.map(val => -val)];
        
        // Build numerator coefficients: ma[0]*z^m + ma[1]*z^(m-1) + ...
        // Need to determine highest power by considering both AR and MA orders
        const maxOrder = Math.max(ar.length, ma.length - 1);
        const numCoeffs = Array(maxOrder + 1).fill(0);
        
        // Place MA coefficients at correct positions for z^m, z^(m-1), etc.
        for (let i = 0; i < ma.length; i++) {
            numCoeffs[i] = ma[i];
        }
        
        const denPoly = formatPolynomial(denCoeffs, 'z', true);
        const numPoly = formatPolynomial(numCoeffs, 'z', true);
        
        return `$$ (${denPoly}) Y(z) = (${numPoly}) U(z) $$`;
        
    } catch (error) {
        console.warn('Z-domain equation generation failed:', error);
        return '$$ Y(z) = U(z) $$';
    }
}

// Binomial coefficient calculation
function binomialCoeff(n, k) {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
    }
    return result;
}

// Apply Tustin transformation to a single polynomial - GENERALIZED
function tustinTransformPoly(coeffs, Ts = 1) {
    const n = coeffs.length - 1; // Degree of polynomial
    if (n < 0) return [0];
    
    const resultDegree = n;
    const result = new Array(resultDegree + 1).fill(0);
    
    // For each term a_k * z^k in the original polynomial
    for (let k = 0; k < coeffs.length; k++) {
        const coeff = coeffs[k];
        const power = n - k; // Power of z for this coefficient
        
        if (Math.abs(coeff) < 1e-10) continue;
        
        // z^power = ((1 + s*Ts/2)/(1 - s*Ts/2))^power
        // Use binomial expansion approximation for numerator
        for (let i = 0; i <= Math.min(power, resultDegree); i++) {
            const binomCoeff = binomialCoeff(power, i);
            const contribution = coeff * binomCoeff * Math.pow(Ts/2, i);
            
            if (resultDegree - i >= 0) {
                result[resultDegree - i] += contribution;
            }
        }
    }
    
    return result;
}

// Continuous S-domain (Tustin transformation) - GENERALIZED for any order
function sDomainEq(ar, ma, Ts = 1) {
    if (!ar || !ma || ar.length === 0 || ma.length === 0) {
        return '$$ Y(s) = 0 $$';
    }
    
    try {
        // For higher orders, use a simplified approximation
        if (ar.length > 3) {
            // Simplified approach for higher order systems
            const order = ar.length;
            let denPoly = `s^${order}`;
            
            // Add simplified terms
            for (let i = 0; i < Math.min(ar.length, 3); i++) {
                if (Math.abs(ar[i]) > 1e-10) {
                    const power = order - i - 1;
                    const coeff = ar[i] * Math.pow(2/Ts, i+1);
                    const term = power === 1 ? 's' : power === 0 ? '' : `s^${power}`;
                    const sign = coeff >= 0 ? ' + ' : ' - ';
                    denPoly += `${sign}${formatNumber(Math.abs(coeff))}${term}`;
                }
            }
            
            const numCoeff = ma[0] * Math.pow(2/Ts, ma.length-1);
            const numPoly = formatNumber(numCoeff);
            
            return `$$ (${denPoly}) Y(s) ≈ ${numPoly} U(s) $$`;
        } else {
            // For lower orders, use more accurate transformation
            // Build z-domain polynomials - CORRECTED to match zDomainEq
            const denCoeffsZ = [1, ...ar.map(val => -val)]; // Same as zDomainEq
            const maxOrder = Math.max(ar.length, ma.length - 1);
            const numCoeffsZ = Array(maxOrder + 1).fill(0);
            for (let i = 0; i < ma.length; i++) {
                numCoeffsZ[i] = ma[i];
            }
            
            // Apply Tustin transformation
            const denCoeffsS = tustinTransformPoly(denCoeffsZ, Ts);
            const numCoeffsS = tustinTransformPoly(numCoeffsZ, Ts);
            
            // Format polynomials
            const denPoly = formatPolynomial(denCoeffsS, 's', true);
            const numPoly = formatPolynomial(numCoeffsS, 's', true);
            
            return `$$ (${denPoly}) Y(s) = ${numPoly} U(s) $$`;
        }
        
    } catch (error) {
        console.warn('S-domain transformation failed, using simple approximation:', error.message);
        
        // Fallback approximation
        const order = ar.length;
        let denPoly = `s^${order}`;
        let numPoly = formatNumber(ma[0]);
        
        // Add lower order terms (simplified)
        for (let i = 0; i < Math.min(ar.length, 2); i++) {
            if (Math.abs(ar[i]) > 1e-10) {
                const power = order - i - 1;
                const term = power === 1 ? 's' : power === 0 ? '' : `s^${power}`;
                const sign = ar[i] >= 0 ? ' + ' : ' - ';
                denPoly += `${sign}${formatNumber(Math.abs(ar[i]))}${term}`;
            }
        }
        
        return `$$ (${denPoly}) Y(s) ≈ ${numPoly} U(s) $$`;
    }
}

// =====================================
// CHARTS AND VISUALIZATION
// =====================================

// --- Charts ---
let chartOut, chartModel;
function plotCharts(y,yModel,u,fitted,Ts=1){
    const labels=y.map((_,i)=>i);
    if(chartOut) chartOut.destroy();
    if(chartModel) chartModel.destroy();

    chartOut=new Chart(document.getElementById("chartOutput"),{
        type:'line',
        data:{labels,datasets:[
            {label:"Entrée u[k]",data:u,borderColor:"#facc15",borderWidth:2,fill:false,borderDash:[5,5]},
            {label:"Sortie réelle y[k]",data:y,borderColor:"#38bdf8",borderWidth:2,fill:false}
        ]},
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Échantillons k'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amplitude'
                    }
                }
            }
        }
    });

    chartModel=new Chart(document.getElementById("chartModel"),{
        type:'line',
        data:{labels,datasets:[
            {label:"Sortie modélisée",data:yModel,borderColor:"#f472b6",borderWidth:2,fill:false},
            {label:"Sortie réelle",data:y,borderColor:"#38bdf8",borderWidth:1,fill:false,borderDash:[5,5]}
        ]},
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Échantillons k'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amplitude'
                    }
                }
            }
        }
    });

    // --- Time-domain ARMA difference equation ---
    let eq=`$$ y[k] =`;
    let hasTerms = false;
    fitted.a.forEach((val,i)=>{ 
        if(Math.abs(val) > 1e-6) {
            const coeff = -val; // This negation is why we need NO negation in zDomainEq!
            const sign = hasTerms ? (coeff >= 0 ? ' + ' : ' - ') : (coeff < 0 ? ' - ' : ' ');
            eq += `${sign}${Math.abs(coeff).toFixed(4)} y[k-${i+1}]`;
            hasTerms = true;
        }
    });
    fitted.b.forEach((val,i)=>{ 
        if(Math.abs(val) > 1e-6) {
            const sign = hasTerms ? (val >= 0 ? ' + ' : ' - ') : (val < 0 ? ' - ' : ' ');
            eq += `${sign}${Math.abs(val).toFixed(4)} u[k-${i}]`;
            hasTerms = true;
        }
    });
    if (!hasTerms) eq += ' 0';
    eq+=' $$';
    document.getElementById("armaEq").innerHTML=eq;

    // --- Z-domain ---
    document.getElementById("tfz").innerHTML=zDomainEq(fitted.a,fitted.b);

    // --- Continuous S-domain ---
    document.getElementById("tfs").innerHTML=sDomainEq(fitted.a,fitted.b,Ts);

    // Render math equations
    renderMathInElement(document.getElementById("armaEq"));
    renderMathInElement(document.getElementById("tfz"));
    renderMathInElement(document.getElementById("tfs"));
}

// --- Run ---
function updateCharts(){
    const n=parseInt(document.getElementById("numPoints").value)||200;
    const Ts=1; // échantillonnage fixe
    const u=generateInput(n,inputType);
    const y=simulateSystem(u,a,b);
    const fitted=fitARMA(y,u,2,1);
    plotCharts(y,fitted.yModel,u,fitted,Ts);
}

// Initialize
updateCharts();
document.getElementById("simulateBtn").addEventListener("click",updateCharts);
document.getElementById("lqcBtn").addEventListener("click", () => {
    window.location.href = "lqc.html";
});