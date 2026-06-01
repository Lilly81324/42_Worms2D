import { Vector2 } from 'babylonjs';

// SPAWN AREAS
const area1 = 
[
	new Vector2(36, -15),
	new Vector2(34, -15),
	new Vector2(32, -14)
];

const area2 = 
[
	new Vector2(35, 3),
	new Vector2(33, 3),
	new Vector2(31, 3)
];

const area3 = 
[
	new Vector2(33.5, 14),
	new Vector2(30, 18)
];

const area4 =
[
	new Vector2(26.5, 22),
	new Vector2(24.5, 21.5),
	new Vector2(22.5, 21)
]

const area5 = 
[
	new Vector2(24, 9),
	new Vector2(22, 8),
	new Vector2(20, 8),
	new Vector2(18, 8),
	new Vector2(16, 8)
]

const area6 =
[
	new Vector2(27.5, -3),
	new Vector2(25.8, -2.8)
]

const area7 = 
[
	new Vector2(24, 1),
	new Vector2(22, 1),
	new Vector2(20, 1),
	new Vector2(18, 1),
]

const area8 =
[
	new Vector2(16, 0.5),
	new Vector2(14, 0),
	new Vector2(12, -0.5)
]

const area9 =
[
	new Vector2(21, -16),
	new Vector2(18.5, -24)
]

const area10 = 
[
	new Vector2(16, -16),
	new Vector2(14, -14.7),
	new Vector2(12, -14.5),
	new Vector2(10, -14.5)
]

const area11 =
[
	new Vector2(8, -14.5),
	new Vector2(6, -14.5),
	new Vector2(4, -15.5),
	new Vector2(2, -16.5),
	new Vector2(0, -17.5)
]

const area12 = 
[
	new Vector2(-3, -22.5),
	new Vector2(-5, -22.7),
	new Vector2(-7, -22),
]

const area13 =
[
	new Vector2(-9, -21),
	new Vector2(-11, -22),
	new Vector2(-13, -23)
]

const area14 =
[
	new Vector2(1, 7),
	new Vector2(-1, 7.5),
	new Vector2(-3, 8.2),
	new Vector2(-5, 8.9),
	new Vector2(-7, 9.6)
]

const area15 =
[
	new Vector2(-10.5, 4),
	new Vector2(-12.5, 3),
	new Vector2(-14.5, 2.2),
	new Vector2(-16.5, 2.5)
]

const area16 = 
[
	new Vector2(-13, 24.2),
	new Vector2(-15, 24.2),
	new Vector2(-17, 24),
]

const area17 =
[
	new Vector2(-19, 24),
	new Vector2(-21, 24),
	new Vector2(-23, 24)
]

const area18 = 
[
	new Vector2(-20.5, 28),
	new Vector2(-22.5, 28.7),
	new Vector2(-24.5, 28.7),
	new Vector2(-26.5, 28.5),
]

const area19 =
[
	new Vector2(-28.5, 28.5),
	new Vector2(-30.5, 28.5),
	new Vector2(-32.5, 28.3)
]

const area20 =
[
	new Vector2(-29.5, 12.7),
	new Vector2(-31.5, 13),
	new Vector2(-33.5, 13.3),
	new Vector2(-35.5, 13.6),
	new Vector2(-37.5, 13.9)
]

const area21 =
[
	new Vector2(-29, -1),
	new Vector2(-31, -0.7),
	new Vector2(-33, -0.4),
	new Vector2(-35, -0.1),
	new Vector2(-37, -1.3)
]

const area22 = 
[
	new Vector2(-32.3, -14.3),
	new Vector2(-32.3, -14.3),
	new Vector2(-34.3, -14.6)
]

const area23 =
[
	new Vector2(-28.5, -24.1),
	new Vector2(-30.5, -24.6)
]

export function generateSpawnAreas(): Vector2[][] {
	return [
	area1,
	area2,
	area3,
	area4,
	area5,
	area6,
	area7,
	area8,
	area9,
	area10,
	area11,
	area12,
	area13,
	area14,
	area15,
	area16,
	area17,
	area18,
	area19,
	area20,
	area21,
	area22,
	area23
]
}
