import { Scene, Vector3 } from "@babylonjs/core";
import { keyInfo, MovementState } from "./MovementState";
import { Worm } from "../../player/Worm";
import { Achievements } from "../../data/achievments";

function forChosenWorm(worm: Worm, achievements: Achievements, keyStatus: keyInfo) {
	const now = Date.now();
	worm.canJump = now >= worm.jumpTimer;
	worm.pos.x = worm.collider.position.x
	const currentX = worm.pos.x;
	const delta = Math.abs(currentX - worm.previousPos.x);
	achievements.addToDistance(delta);
	worm.previousPos.x = currentX;

	if (!worm.onGround)
		return ; 

	if (worm.canJump && keyStatus['w'])
		worm.jump(-0.65, 6, now);
	else if (worm.canJump && keyStatus['e'])
		worm.jump(2.2, 3, now);
	else
	{
		if (keyStatus['a'])
			worm.move(-1, (3 * Math.PI) / 2);
		else if (keyStatus['d'])
			worm.move(1, Math.PI / 2);
		else
			worm.stop();

		const currentVel = worm.aggregate.body.getLinearVelocity();
		worm.aggregate.body.setLinearVelocity
		(
			new Vector3
			(
				(worm.dirX * worm.playerSpeed) * worm.isMoving, 
				currentVel.y,
				0
			)
		);
	}

}

function forAllWorms(worm: Worm, scene: Scene) {
	// Create Vectors for ray cast
	const rayStart = worm.collider.getAbsolutePosition();
	const rayEnd = rayStart.add(new Vector3(0, -1.3, 0));
	const rayRes = (scene.getPhysicsEngine()!).raycast(rayStart, rayEnd);

	// Check with raycast if worm on ground
	if (rayRes.hasHit){
		worm.onGround = true;
		worm.airAnim?.stop();
	}
	else{
		worm.onGround = false;
		worm.canJump = false;
	}

	// Remove gravity if on ground
	if (worm.onGround)
		worm.aggregate.body.setGravityFactor(0);
	else
		worm.aggregate.body.setGravityFactor(1);
}

export function movementTick(state: MovementState) {
	const machine = state.machine
	if (!machine.loaded || machine.loaded.players.length == 0)
		return ;

	machine.loaded.players.forEach((player) => {
		player.worms.forEach((worm) => {
			forAllWorms(worm, machine.scene)
		})
	})
	forChosenWorm(machine.loaded.turn.chosenWorm, machine.achievements, state.keyStatus);
}