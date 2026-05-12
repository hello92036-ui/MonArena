// 15x15 Grid Map - 52 Cell Perimeter + 6 Cell Home Stretches
export const COMMON_PATH = [
  // RED START segment
  {r:13,c:6}, {r:12,c:6}, {r:11,c:6}, {r:10,c:6}, {r:9,c:6}, 
  {r:8,c:5}, {r:8,c:4}, {r:8,c:3}, {r:8,c:2}, {r:8,c:1}, {r:8,c:0},
  {r:7,c:0}, // Index 11
  // GREEN START segment
  {r:6,c:0}, {r:6,c:1}, {r:6,c:2}, {r:6,c:3}, {r:6,c:4}, {r:6,c:5},
  {r:5,c:6}, {r:4,c:6}, {r:3,c:6}, {r:2,c:6}, {r:1,c:6}, {r:0,c:6},
  {r:0,c:7}, // Index 24
  // YELLOW START segment
  {r:0,c:8}, {r:1,c:8}, {r:2,c:8}, {r:3,c:8}, {r:4,c:8}, {r:5,c:8},
  {r:6,c:9}, {r:6,c:10}, {r:6,c:11}, {r:6,c:12}, {r:6,c:13}, {r:6,c:14},
  {r:7,c:14}, // Index 37
  // BLUE START segment
  {r:8,c:14}, {r:8,c:13}, {r:8,c:12}, {r:8,c:11}, {r:8,c:10}, {r:8,c:9},
  {r:9,c:8}, {r:10,c:8}, {r:11,c:8}, {r:12,c:8}, {r:13,c:8}, {r:14,c:8},
  {r:14,c:7}, {r:14,c:6} // Missing cell added here
];

export const HOME_STRETCHES = [
  // Red Home Stretch (Player 0)
  [{r:13,c:7}, {r:12,c:7}, {r:11,c:7}, {r:10,c:7}, {r:9,c:7}, {r:8,c:7}],
  // Green Home Stretch (Player 1)
  [{r:7,c:1}, {r:7,c:2}, {r:7,c:3}, {r:7,c:4}, {r:7,c:5}, {r:7,c:6}],
  // Yellow Home Stretch (Player 2)
  [{r:1,c:7}, {r:2,c:7}, {r:3,c:7}, {r:4,c:7}, {r:5,c:7}, {r:6,c:7}],
  // Blue Home Stretch (Player 3)
  [{r:7,c:13}, {r:7,c:12}, {r:7,c:11}, {r:7,c:10}, {r:7,c:9}, {r:7,c:8}]
];

export const BASE_POSITIONS = [
  [{r:11,c:2}, {r:11,c:3}, {r:12,c:2}, {r:12,c:3}], // Red
  [{r:2,c:2}, {r:2,c:3}, {r:3,c:2}, {r:3,c:3}],     // Green
  [{r:2,c:11}, {r:2,c:12}, {r:3,c:11}, {r:3,c:12}], // Yellow
  [{r:11,c:11}, {r:11,c:12}, {r:12,c:11}, {r:12,c:12}] // Blue
];
