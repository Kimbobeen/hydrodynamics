document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const dieSettingSlider = document.getElementById('dieSetting');
    const dieSettingValueDisplay = document.getElementById('dieSettingValue');
    const runButton = document.getElementById('runButton');
    const targetWidthDisplay = document.getElementById('targetWidth');
    const currentWidthDisplay = document.getElementById('currentWidth');
    const statusMessageDisplay = document.getElementById('statusMessage');

    let targetWidth;
    const optimalDieSetting = 60; // 이 설정값에서 최대 또는 최적의 결과가 나옴
    const baseWidthAtOptimal = 80; // optimalDieSetting에서의 기본 압출물 두께
    const sensitivityFactor = 0.016; // 설정값이 optimal에서 벗어날 때 두께 변화 민감도

    const dieEntryWidth = 80; // 다이로 들어가는 유체의 초기 폭 (시각화용)
    const fluidColor = '#3498db'; // 유체 색상
    const dieColor = '#7f8c8d';   // 다이 색상

    function initializeGame() {
        // 달성 가능한 목표 두께 생성 (모델의 최소/최대 출력 범위 내)
        // 모델: finalWidth = baseWidthAtOptimal - sensitivityFactor * (setting - optimalDieSetting)^2
        // Min setting 10: 80 - 0.016 * (10-60)^2 = 80 - 0.016*2500 = 80-40 = 40
        // Max setting 100: 80 - 0.016 * (100-60)^2 = 80 - 0.016*1600 = 80-25.6 = 54.4
        // 따라서 목표 범위는 약 40 ~ 80
        targetWidth = Math.floor(Math.random() * (baseWidthAtOptimal - 40 + 1)) + 40;
        targetWidthDisplay.textContent = targetWidth.toFixed(2);
        currentWidthDisplay.textContent = 'N/A';
        statusMessageDisplay.textContent = '다이 설정을 조절하고 공정을 시작하세요.';
        statusMessageDisplay.style.color = '#333';
        dieSettingSlider.value = 50; // 초기 슬라이더 값
        dieSettingValueDisplay.textContent = dieSettingSlider.value;
        drawBaseVisualization(parseFloat(dieSettingSlider.value));
    }

    function drawBaseVisualization(currentDieOpening, extrudateWidth = null) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const canvasHeight = canvas.height;
        const canvasWidth = canvas.width;
        
        const dieBodyVisualWidth = 80; // 화면상 다이 몸체의 너비
        const dieRenderStartX = canvasWidth * 0.25; // 다이 몸체 시작 X 좌표
        const dieRenderExitX = dieRenderStartX + dieBodyVisualWidth; // 다이 몸체 끝 X 좌표

        // 1. 다이로 들어가는 유체 흐름 표현
        ctx.fillStyle = fluidColor;
        ctx.fillRect(0, (canvasHeight - dieEntryWidth) / 2, dieRenderStartX, dieEntryWidth);

        // 2. 다이 몸체 그리기 (단순화된 사각형 두 개)
        ctx.fillStyle = dieColor;
        // 상단 다이 블록
        ctx.fillRect(dieRenderStartX, 0, dieBodyVisualWidth, (canvasHeight - currentDieOpening) / 2);
        // 하단 다이 블록
        ctx.fillRect(dieRenderStartX, (canvasHeight + currentDieOpening) / 2, dieBodyVisualWidth, (canvasHeight - currentDieOpening) / 2);

        // 3. 다이 내부를 통과하는 유체 그리기
        ctx.fillStyle = fluidColor;
        ctx.fillRect(dieRenderStartX, (canvasHeight - currentDieOpening) / 2, dieBodyVisualWidth, currentDieOpening);
        
        // 4. 압출된 유체 그리기 (또는 대기 상태 표시)
        if (extrudateWidth !== null) {
            const extrudateY = (canvasHeight - extrudateWidth) / 2;
            ctx.fillStyle = fluidColor;
            ctx.fillRect(dieRenderExitX, extrudateY, canvasWidth - dieRenderExitX, extrudateWidth);
        } else {
            // 압출 대기 시각화
            const placeholderY = (canvasHeight - currentDieOpening) / 2;
            ctx.fillStyle = '#E0E0E0'; // 연한 회색
            ctx.fillRect(dieRenderExitX, placeholderY, canvasWidth - dieRenderExitX, currentDieOpening);
            ctx.fillStyle = '#888888'; // 중간 회색 글자
            ctx.font = "14px 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("압출 대기", dieRenderExitX + (canvasWidth - dieRenderExitX) / 2, canvasHeight / 2);
        }
    }

    // 점탄성 효과(다이 스웰)를 매우 단순화한 게임용 모델
    function calculateSwelledWidth(currentSetting) {
        // currentSetting: 플레이어가 조절하는 다이 설정 값 (10 ~ 100)
        // 이 함수는 실제 점탄성 모델이 아니며, 게임 플레이를 위한 단순화된 수식입니다.
        // optimalDieSetting 값에서 가장 두꺼운(또는 얇은) 결과가 나오고, 멀어질수록 달라지는 포물선 형태.
        let width = baseWidthAtOptimal - sensitivityFactor * Math.pow(currentSetting - optimalDieSetting, 2);
        
        // 결과값이 너무 작거나 음수가 되지 않도록 최소값 보정
        return Math.max(5, width); 
    }

    function runSimulation() {
        const currentDieSetting = parseFloat(dieSettingSlider.value);
        const actualWidth = calculateSwelledWidth(currentDieSetting);

        currentWidthDisplay.textContent = actualWidth.toFixed(2);
        drawBaseVisualization(currentDieSetting, actualWidth);

        const difference = Math.abs(actualWidth - targetWidth);
        const tolerance = 2.0; // 성공으로 간주하는 오차 범위

        if (difference <= tolerance) {
            statusMessageDisplay.textContent = `성공! 목표 (${targetWidth.toFixed(2)}) 달성! (오차: ${difference.toFixed(2)})`;
            statusMessageDisplay.style.color = 'green';
        } else if (difference <= tolerance * 2.5) {
            statusMessageDisplay.textContent = `거의 근접! 조금만 더 조절해보세요. (오차: ${difference.toFixed(2)})`;
            statusMessageDisplay.style.color = 'orange';
        } else {
            statusMessageDisplay.textContent = `실패. 목표치와 차이가 큽니다. (오차: ${difference.toFixed(2)})`;
            statusMessageDisplay.style.color = 'red';
        }
    }

    dieSettingSlider.addEventListener('input', (event) => {
        const currentValue = parseFloat(event.target.value);
        dieSettingValueDisplay.textContent = currentValue;
        // 슬라이더를 움직일 때마다 다이 개방 크기를 시각적으로 업데이트 (압출물 없이)
        drawBaseVisualization(currentValue);
        currentWidthDisplay.textContent = 'N/A'; // 이전 결과 초기화
        statusMessageDisplay.textContent = '공정 시작 버튼을 눌러 결과를 확인하세요.';
        statusMessageDisplay.style.color = '#333';
    });

    runButton.addEventListener('click', runSimulation);

    // 게임 시작
    initializeGame();
});

