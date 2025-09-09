visualizations.bars = function(audioData, dataArray) {
    background(0, 0, 0, 1);
    
    let barWidth = width / audioManager.bufferLength;
    for (let i = 0; i < audioManager.bufferLength; i++) {
        let barHeight = map(dataArray[i], 0, 255, 0, height);
        let sat = map(i, 0, audioManager.bufferLength, 50, 100);
        fill(baseColor[0], sat, baseColor[2]);
        rect(i * barWidth, height - barHeight, barWidth, barHeight);
    }
}
