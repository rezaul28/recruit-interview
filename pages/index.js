import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import styles from "../styles/Snake.module.css";

const Config = {
  height: 25,
  width: 25,
  cellSize: 32,
};

const CellType = {
  Snake: "snake",
  Food: "food",
  Empty: "empty",
};

const Direction = {
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
  Top: { x: 0, y: -1 },
  Bottom: { x: 0, y: 1 },
};

const Cell = ({ x, y, type }) => {
  const getStyles = () => {
    switch (type) {
      case CellType.Snake:
        return {
          backgroundColor: "yellowgreen",
          borderRadius: 8,
          padding: 2,
        };

      case CellType.Food:
        return {
          backgroundColor: "darkorange",
          borderRadius: 20,
          width: 32,
          height: 32,
        };

      default:
        return {};
    }
  };
  return (
    <div
      className={styles.cellContainer}
      style={{
        left: x * Config.cellSize,
        top: y * Config.cellSize,
        width: Config.cellSize,
        height: Config.cellSize,
      }}
    >
      <div className={styles.cell} style={getStyles()}></div>
    </div>
  );
};

const getRandomCell = () => ({
  x: Math.floor(Math.random() * Config.width),
  y: Math.floor(Math.random() * Config.width),
});

const Snake = () => {
  const getDefaultSnake = () => [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
  ];
  const grid = useRef();

  // snake[0] is head and snake[snake.length - 1] is tail
  const [snake, setSnake] = useState(getDefaultSnake());
  const [direction, setDirection] = useState(Direction.Right);

  const [food, setFood] = useState([{ x: 4, y: 10 }]);
  const [score, setScore] = useState(0);
  const [scoreUp, setScoreUp] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  // move the snake
  useEffect(() => {
    const runSingleStep = () => {
      setSnake((snake) => {
        const head = snake[0];
        let newHead = { x: head.x + direction.x, y: head.y + direction.y };

        //if snake touch itself, game over.
        if (isSnake(newHead)) {
          setGameOver((gameOver) => true);
          return snake;
        }
        //if goes to out of right boundary, appears from left
        if (newHead.x > Config.width) newHead.x = 0;
        //if goes to out of left boundary, appears from right
        if (newHead.x < 0) newHead.x = Config.width;
        //if goes to out of top boundary, appears from bottom
        if (newHead.y > Config.width) newHead.y = 0;
        //if goes to out of bottom boundary, appears from top
        if (newHead.y < 0) newHead.y = Config.width;
        // make a new snake by extending head
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        const newSnake = [newHead, ...snake];

        // remove tail
        if (!scoreUp) {
          newSnake.pop();
        }
        setScoreUp((scoreUp) => false);
        return newSnake;
      });
    };

    runSingleStep();
    let timer = setInterval(runSingleStep, 500);

    return () => clearInterval(timer);
  }, [direction, food, scoreUp]);

  useEffect(() => {
    if (gameOver) {
      //if game is over, everything will be reset.
      setSnake((snake) => (snake = getDefaultSnake()));
      setFood((food) => (food = [{ x: 4, y: 10 }]));
      setScore((score) => 0);
      setGameOver((gameOver) => false);
    }
  }, [gameOver]);

  // update score whenever head touches a food
  useEffect(() => {
    const head = snake[0];
    if (isFood(head)) {
      setScore((score) => {
        return score + 1;
      });
      setScoreUp((scoreUp) => true);
      setFood((food) => {
        let newFood = getRandomCell();
        while (isSnake(newFood)) {
          newFood = getRandomCell();
        }
        let collideFoodPosition = collideFood(head);
        food.push(newFood);
        newFood = food.filter((point) => {
          let abc =
            point.x != collideFoodPosition[0].x &&
            point.y != collideFoodPosition[0].y;
          return abc;
        });
        return (food = newFood);
      });
    }
  }, [snake]);

  //new food will be added after every 3 sec.
  useEffect(() => {
    const addFood = () => {
      setTimeout(() => {
        let newFood = getRandomCell();
        while (isSnake(newFood)) {
          newFood = getRandomCell();
        }
        setFood((food) => {
          food.push(newFood);
          newFood = food;
          return (food = newFood);
        });
        addFood();
      }, 3000);
    };
    addFood();
  }, []);

  useEffect(() => {
    const removeFood = (timeInterval) => {
      console.log("called");
      setTimeout(() => {
        setFood((food) => {
          if (food.length == 1) return food;
          //removes oldest food
          food.shift();
          let existingFood = food;
          return existingFood;
        });
        //always calls removedFood with 3sec time interval.
        removeFood(3000);
      }, timeInterval);
    };
    //removedFood function called with 10sec timeOut if game is just started or score is changed.
    removeFood(10000);
  }, [food]);

  useEffect(() => {
    const handleNavigation = (event) => {
      switch (event.key) {
        case "ArrowUp":
          if (JSON.stringify(direction) != JSON.stringify(Direction.Bottom))
            setDirection(Direction.Top);
          break;

        case "ArrowDown":
          if (JSON.stringify(direction) != JSON.stringify(Direction.Top))
            setDirection(Direction.Bottom);
          break;

        case "ArrowLeft":
          if (JSON.stringify(direction) != JSON.stringify(Direction.Right))
            setDirection(Direction.Left);
          break;

        case "ArrowRight":
          if (JSON.stringify(direction) != JSON.stringify(Direction.Left))
            setDirection(Direction.Right);
          break;
      }
    };
    window.addEventListener("keydown", handleNavigation);

    return () => window.removeEventListener("keydown", handleNavigation);
  }, [direction]);

  // ?. is called optional chaining
  // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
  const isFood = ({ x, y }) =>
    food.find((position) => position.x === x && position.y === y);
  //returns the position of the food that the snake took that time.
  const collideFood = ({ x, y }) =>
    food.filter((position) => position.x === x && position.y === y);
  const isSnake = ({ x, y }) =>
    snake.find((position) => position.x === x && position.y === y);

  const cells = [];
  for (let x = 0; x < Config.width; x++) {
    for (let y = 0; y < Config.height; y++) {
      let type = CellType.Empty;
      if (isFood({ x, y })) {
        type = CellType.Food;
      } else if (isSnake({ x, y })) {
        type = CellType.Snake;
      }
      cells.push(<Cell key={`${x}-${y}`} x={x} y={y} type={type} />);
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        style={{ width: Config.width * Config.cellSize }}
      >
        Score: {score}
      </div>
      <div
        className={styles.grid}
        style={{
          height: Config.height * Config.cellSize,
          width: Config.width * Config.cellSize,
        }}
      >
        {cells}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Snake), {
  ssr: false,
});
