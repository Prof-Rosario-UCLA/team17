export interface FloatingWord {
  text: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  boxWidth?: number;
  boxHeight?: number;
  scale?: number;
  isScaling?: boolean;
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let floatingWords: FloatingWord[] = [];
let animationStarted = false;


export function initializeCanvas() {
  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  requestAnimationFrame(() => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  });

  if (!animationStarted) {
    requestAnimationFrame(update);
    animationStarted = true;
  }
}


export function addFloatingWord(input: string) {
  if (!canvas || !ctx) return;

  if (!floatingWords.find(word => word.text === input)) {
    floatingWords.push({
      text: input,
      x: canvas.width / 2,
      y: canvas.height / 2,
      dx: (Math.random() - 0.5) * 5 + 1,
      dy: (Math.random() - 0.5) * 5 + 1,
      scale: 4,          
      isScaling: true      
    });
  }
}


function drawWord(wordObj: FloatingWord) {
  const scale = wordObj.scale ?? 1;
  ctx.save();

  ctx.translate(wordObj.x, wordObj.y);
  ctx.scale(scale, scale);
  ctx.translate(-wordObj.x, -wordObj.y);

  ctx.font = `${16}px Arial`;
  const paddingX = 12;
  const paddingY = 6;

  const textWidth = ctx.measureText(wordObj.text).width;
  const textHeight = 16;

  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = textHeight + paddingY * 2;

  wordObj.boxWidth = boxWidth;
  wordObj.boxHeight = boxHeight;

  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.roundRect(wordObj.x, wordObj.y, boxWidth, boxHeight, 6);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(wordObj.text, wordObj.x + paddingX, wordObj.y + paddingY);

  ctx.restore();
}



function update(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    //add motion
    floatingWords.forEach((word) => {
        if (word.isScaling && word.scale !== undefined) {
          word.scale -= 0.05;
          if (word.scale <= 1) {
            word.scale = 1;
            word.isScaling = false;
          }
        }
        drawWord(word);
        if (!word.isScaling) {
          word.x += word.dx;
          word.y += word.dy;
          
          //collisions 
          if (word.x <= 0 || word.x + (word.boxWidth || 0) >= canvas.width) {
          word.dx *= -1;
          }
          
          if (word.y <= 0 || word.y + (word.boxHeight || 0) >= canvas.height) {
          word.dy *= -1;
          }
        }
    });
    requestAnimationFrame(update);
}