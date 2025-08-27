# DiscreteStudio

**A simple web app to analyze and simulate discrete control systems**

Ever wondered how your digital control system behaves? DiscreteStudio makes it easy to visualize and understand discrete systems without complicated software or expensive tools.

![Transfer Function Input](image2.PNG)

## What does it do?

Think of it as a digital playground for engineers and students. You input a mathematical equation (transfer function), and the app shows you:

- How your system responds to different inputs
- Mathematical models in easy-to-read formats  
- Real-time simulations you can interact with
- Beautiful charts that actually make sense

![System Response](image1.png)

## Why I built this

As an engineering student/professional, I got tired of:
- Complex software that takes forever to learn
- Expensive tools that universities can't always afford
- Having to switch between multiple programs for basic analysis

So I built DiscreteStudio - one simple web app that does everything you need for discrete system analysis.

## Features

### 🎯 **Transfer Function Analyzer**
Just type in your G(z) equation and hit analyze. The app figures out the rest.

![State Space](image3.png)

### 📊 **Smart Visualization**
- See your system's step response instantly
- Compare different inputs side by side
- Interactive charts you can zoom and explore

### 🎮 **Interactive Simulation**
Choose your input signal and watch your system respond in real-time:
- Step signals
- Ramps  
- Impulses
- Sine waves
- Even noisy signals!

![Input Types](image4.png)

### 🔢 **Automatic Calculations**
The app automatically converts your transfer function into:
- ARMA models (those difference equations we all love/hate)
- State-space representations
- All the matrices you need

![Live Simulation](image5.png)

## How to use it

**Step 1:** Type your transfer function
```
Example: G(z) = (z^2 + 0.5z + 1) / (z^2 - 1.2z + 0.36)
```

**Step 2:** Click "Start Analysis" and watch the magic happen

**Step 3:** Pick an input signal type (step, ramp, etc.)

**Step 4:** Hit "Simulate" and see your results

That's it! No manuals to read, no complex setup.

## Getting Started

### The Easy Way
1. Download or clone this repository
2. Open `index.html` in any modern browser
3. Start analyzing!

### For Developers
```bash
git clone https://github.com/yourusername/discrete-studio.git
cd discrete-studio
python -m http.server 8000
# Go to http://localhost:8000
```

## What's Inside

- **Pure web technologies** - HTML, CSS, JavaScript. No fancy frameworks to break.
- **Tailwind CSS** - Because life's too short for ugly interfaces
- **Custom math engine** - Built specifically for discrete systems
- **Interactive charts** - See your data, don't just stare at numbers

## Perfect For

- **Engineering Students** - Homework, projects, understanding concepts
- **Teachers** - Live demonstrations in class
- **Engineers** - Quick analysis without opening MATLAB
- **Curious People** - Want to understand how digital systems work

## Roadmap (What's Coming)

- [ ] More input signal types
- [ ] Frequency analysis (Bode plots)
- [ ] Save/load your work
- [ ] Mobile-friendly design
- [ ] System identification from real data
