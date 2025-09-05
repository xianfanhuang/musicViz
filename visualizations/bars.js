// 可视化函数
visualizations.bars = function() {
    // Translate to top-left corner to simulate 2D canvas
    push();
    translate(-width / 2, -height / 2);

    background(0, 0, 0, 1);
    
    let barWidth = width / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
        let barHeight = map(dataArray[i], 0, 255, 0, height);
        let sat = map(i, 0, bufferLength, 50, 100);
        fill(baseColor[0], sat, baseColor[2]);
        rect(i * barWidth, height - barHeight, barWidth, barHeight);
    }
    pop();
}
