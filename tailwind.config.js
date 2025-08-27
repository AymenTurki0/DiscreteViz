/** @type {import('tailwindcss').Config} */
module.exports = {
content: ['./src/**/*.html', './src/js/**/*.js'],
theme: {
extend: {
animation: {
'gradient-x': 'gradient-x 6s ease infinite',
'fade-slide-in': 'fade-slide-in 0.7s ease both',
'fade-slide-out': 'fade-slide-out 0.5s ease both'
},
keyframes: {
'gradient-x': {
'0%, 100%': { backgroundPosition: '0% 50%' },
'50%': { backgroundPosition: '100% 50%' }
},
'fade-slide-in': {
'0%': { opacity: 0, transform: 'translateY(10px)' },
'100%': { opacity: 1, transform: 'translateY(0)' }
},
'fade-slide-out': {
'0%': { opacity: 1, transform: 'translateY(0)' },
'100%': { opacity: 0, transform: 'translateY(-6px)' }
}
},
boxShadow: {
'xl-soft': '0 20px 50px rgba(0,0,0,0.15)'
}
}
},
plugins: []
};