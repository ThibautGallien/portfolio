"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { useLanguage } from "@/context/LanguageContext";

const GameModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const isMobile =
    typeof window !== "undefined" &&
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  let dx = 1;
  let dy = 0;
  let snake = [{ x: 10, y: 10 }];
  let food = { x: 5, y: 5 };
  let animationFrameId;
  let speed = 10;
  let lastRenderTime = 0;
  const gridSize = 20;
  const eatSound = new Audio("/sounds/eat.mp3");

  const changeDirection = (dir) => {
    if (gameOver) return;
    switch (dir) {
      case "up":
        if (dy !== 1) {
          dx = 0;
          dy = -1;
        }
        break;
      case "down":
        if (dy !== -1) {
          dx = 0;
          dy = 1;
        }
        break;
      case "left":
        if (dx !== 1) {
          dx = -1;
          dy = 0;
        }
        break;
      case "right":
        if (dx !== -1) {
          dx = 1;
          dy = 0;
        }
        break;
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => changeDirection("up"),
    onSwipedDown: () => changeDirection("down"),
    onSwipedLeft: () => changeDirection("left"),
    onSwipedRight: () => changeDirection("right"),
    preventDefaultTouchmoveEvent: true,
    trackTouch: true,
  });

  let restartGame;

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    const generateFood = () => {
      let valid = false;
      while (!valid) {
        food = {
          x: Math.floor(Math.random() * (canvas.width / gridSize)),
          y: Math.floor(Math.random() * (canvas.height / gridSize)),
        };
        valid = !snake.some(
          (segment) => segment.x === food.x && segment.y === food.y
        );
      }
    };

    restartGame = () => {
      snake = [{ x: 10, y: 10 }];
      dx = 1;
      dy = 0;
      generateFood();
      setScore(0);
      setGameOver(false);
      lastRenderTime = 0;
      animationFrameId = requestAnimationFrame(draw);
    };

    const checkEatFood = () => {
      const head = snake[0];
      if (head.x === food.x && head.y === food.y) {
        generateFood();
        eatSound.play();
        if (navigator.vibrate) navigator.vibrate(100);
        return true;
      }
      return false;
    };

    const checkCollision = () => {
      const head = snake[0];
      if (
        head.x < 0 ||
        head.x >= canvas.width / gridSize ||
        head.y < 0 ||
        head.y >= canvas.height / gridSize
      ) {
        return true;
      }
      for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
          return true;
        }
      }
      return false;
    };

    const moveSnake = () => {
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };
      snake.unshift(head);

      if (checkCollision()) {
        setGameOver(true);
        return;
      }

      if (checkEatFood()) {
        setScore((prev) => prev + 10);
      } else {
        snake.pop();
      }
    };

    const draw = (timestamp) => {
      if (timestamp - lastRenderTime < 1000 / speed) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      lastRenderTime = timestamp;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0ff";
      snake.forEach((segment, index) => {
        if (index === 0) ctx.fillStyle = "#ff0";
        ctx.fillRect(
          segment.x * gridSize,
          segment.y * gridSize,
          gridSize,
          gridSize
        );
        ctx.strokeStyle = "#f0f";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          segment.x * gridSize,
          segment.y * gridSize,
          gridSize,
          gridSize
        );
        if (index === 0) ctx.fillStyle = "#0ff";
      });

      ctx.fillStyle = "#f0f";
      ctx.shadowColor = "#f0f";
      ctx.shadowBlur = 10;
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width / gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height / gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
      }

      if (!gameOver) {
        moveSnake();
        animationFrameId = requestAnimationFrame(draw);
      } else {
        ctx.fillStyle = "#ff0";
        ctx.font = "30px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px monospace";
        ctx.fillText(
          `Score: ${score}`,
          canvas.width / 2,
          canvas.height / 2 + 40
        );
        ctx.fillText(
          "Press SPACE or tap RESTART",
          canvas.width / 2,
          canvas.height / 2 + 80
        );
      }
    };

    generateFood();
    animationFrameId = requestAnimationFrame(draw);

    const handleKeyDown = (e) => {
      if (gameOver && e.code === "Space") {
        restartGame();
        return;
      }

      switch (e.code) {
        case "ArrowUp":
          changeDirection("up");
          break;
        case "ArrowDown":
          changeDirection("down");
          break;
        case "ArrowLeft":
          changeDirection("left");
          break;
        case "ArrowRight":
          changeDirection("right");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const preventScroll = (e) => {
      if (["ArrowUp", "ArrowDown"].includes(e.code)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", preventScroll, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", preventScroll);
    };
  }, [isOpen, gameOver]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="game-modal">
        <div className="modal-header">
          <h2>Cyber Snake</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="game-container" {...swipeHandlers}>
          <div className="game-score">Score: {score}</div>
          <canvas ref={canvasRef} className="game-canvas" />
          <div className="game-instructions">
            <p>Use arrow keys or swipe to control the snake.</p>
            <p>Collect the neon food to grow.</p>
            {gameOver && <p>Press SPACE or tap RESTART to play again.</p>}
          </div>

          <button onClick={() => restartGame()} className="restart-button">
            Rejouer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModal;
