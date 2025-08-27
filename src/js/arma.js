/**
 * Simple ARMA model fitting in JS
 * y[k] + a1 y[k-1] + ... + an y[k-n] = b0 u[k] + ... + bm u[k-m]
 */

export function fitARMA(y, u, arOrder=2, maOrder=1){
    const N = y.length;
    const p = arOrder;
    const q = maOrder;

    // Build regression matrix X and target Y
    const X = [];
    const Y = [];

    for(let k=Math.max(p,q); k<N; k++){
        const row = [];
        // AR terms (past outputs)
        for(let i=1; i<=p; i++){
            row.push(-y[k-i]);
        }
        // MA terms (past inputs)
        for(let i=0; i<=q; i++){
            row.push(u[k-i]);
        }
        X.push(row);
        Y.push(y[k]);
    }

    // Solve least squares: theta = (X^T X)^-1 X^T Y
    function transpose(A){
        return A[0].map((_,i)=>A.map(r=>r[i]));
    }

    function multiply(A,B){
        const res = Array(A.length).fill(0).map(()=>Array(B[0].length).fill(0));
        for(let i=0;i<A.length;i++)
            for(let j=0;j<B[0].length;j++)
                for(let k=0;k<B.length;k++)
                    res[i][j] += A[i][k]*B[k][j];
        return res;
    }

    function invertMatrix(M){
        // Simple Gauss-Jordan inversion (for small matrices)
        const n = M.length;
        const I = M.map((r,i)=>r.map((_,j)=>i===j?1:0));
        const A = M.map(r=>[...r]);
        for(let i=0;i<n;i++){
            let diag = A[i][i];
            for(let j=0;j<n;j++){ A[i][j] /= diag; I[i][j] /= diag; }
            for(let k=0;k<n;k++){
                if(k===i) continue;
                const factor = A[k][i];
                for(let j=0;j<n;j++){ A[k][j]-=factor*A[i][j]; I[k][j]-=factor*I[i][j]; }
            }
        }
        return I;
    }

    const Xt = transpose(X);
    const XtX = multiply(Xt,X);
    const XtXinv = invertMatrix(XtX);
    const XtY = multiply(Xt,Y.map(v=>[v]));
    const thetaMat = multiply(XtXinv,XtY);
    const theta = thetaMat.map(v=>v[0]);

    const a = theta.slice(0,p); // AR coefficients
    const b = theta.slice(p);   // MA coefficients

    // Generate modeled output
    const yModel = [];
    for(let k=0;k<N;k++){
        let yk=0;
        for(let i=0;i<p;i++){
            if(k-i-1>=0) yk -= a[i]*yModel[k-i-1];
        }
        for(let i=0;i<b.length;i++){
            if(k-i>=0) yk += b[i]*u[k-i];
        }
        yModel.push(yk);
    }

    return {a,b,yModel};
}
