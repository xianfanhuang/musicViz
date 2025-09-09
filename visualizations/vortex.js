visualizations.vortex = function(audioData, dataArray) {
    background(0, 0, 0); 
    
    let bassColor = color(baseColor[0], baseColor[1], baseColor[2]);
    let midsColor = color(baseColor[0], baseColor[1], baseColor[2]);
    let trebleColor = color(baseColor[0], baseColor[1], baseColor[2]);
    
    bassColor.setAlpha(audioData.bass * 1.5);
    midsColor.setAlpha(audioData.mids * 1.5);
    trebleColor.setAlpha(audioData.treble * 1.5);
    
    noFill();
    strokeWeight(1.5);
    
    let rotationSpeed = currentVisualEnergy * 0.005;
    rotateY(frameCount * rotationSpeed);
    rotateX(frameCount * rotationSpeed * 0.6);
    
    for (let i = 0; i < audioManager.bufferLength; i += 2) {
        let radius = map(dataArray[i], 0, 255, 50, height / 3);
        let angle = map(i, 0, audioManager.bufferLength, 0, TWO_PI * 5);
        let x = radius * cos(angle);
        let y = radius * sin(angle);
        let z = map(dataArray[i], 0, 255, -height / 4, height / 4);
        
        if (i < audioManager.bufferLength / 3) {
            stroke(bassColor);
        } else if (i < audioManager.bufferLength * 2 / 3) {
            stroke(midsColor);
        } else {
            stroke(trebleColor);
        }
        
        push();
        translate(x, y, z);
        box(5 * pulseFactor, 5 * pulseFactor, 5 * pulseFactor);
        pop();
    }
}
