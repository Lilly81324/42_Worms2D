import { Player } from '../../player/Player';
import { Worm } from '../../player/Worm';
import { Turn } from '../4_turn_start/Turn';
import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction, Quaternion, Axis, Vector3, Scene, Observer, Observable } from '@babylonjs/core'

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Move with WASD, then confirm with Space");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} is worming around`);
	}
}

export class MovementState implements IState {
	private next: boolean = false;
	private now: number = 0;
	private keyStatus: any =
	{
		'a': false,
		'd': false,
		'w': false,
		'e': false
	};
	private observer: Observable;
	// Constructor called once pet Canvas
	constructor(private machine: StateMachine) { }
	enter() : Array<IAction> {
		this.reset()

		// Setup
		turnMessage(this.machine);

		// Actions
		const actions: Array<IAction> = [];

		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser() || !this.machine.turn || !this.machine.players)
			return (actions);

		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "a"
		}, () => {
			this.keyStatus['a'] = true;
		}));
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "a"
		}, () => {
			this.keyStatus['a'] = false;
		}));

		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "d"
		}, () => {
			this.keyStatus['d'] = true;
		}));
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "d"
		}, () => {
			this.keyStatus['d'] = false;
		}));

		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "e"
		}, () => {
			this.keyStatus['e'] = true;
		}));
				actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "e"
		}, () => {
			this.keyStatus['e'] = false;
		}));

		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "w"
		}, () => {
			this.keyStatus['w'] = true;
		}));
				actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "w"
		}, () => {
			this.keyStatus['w'] = false;
		}));
			



		// Confirm movement to be done
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));

		this.observer = this.machine.scene.onBeforePhysicsObservable.add(() => {
			if (!this.machine.turn || !this.machine.players)
			return ;
			this.now = Date.now();
			this.machine.turn.chosenWorm.canJump = this.now >= this.machine.turn.chosenWorm.jumpTimer;

			const rayStart = this.machine.turn.chosenWorm.collider.getAbsolutePosition();
			const rayEnd = rayStart.add(new Vector3(0, -1.3, 0));
			const rayRes = (this.machine.scene.getPhysicsEngine()!).raycast(rayStart, rayEnd);

			if (rayRes.hasHit){
				this.machine.turn.chosenWorm.onGround = true;
				this.machine.turn.chosenWorm.airAnim?.stop();
			}
			else{
				this.machine.turn.chosenWorm.onGround = false;
				this.machine.turn.chosenWorm.canJump = false;
			}

			this.machine.turn.chosenWorm.pos.x = this.machine.turn.chosenWorm.collider.position.x;
			const currentX = this.machine.turn.chosenWorm.pos.x;
			const delta = Math.abs(currentX - this.machine.turn.chosenWorm.previousPos.x);
			this.machine.achievements.addToDistance(delta);
			this.machine.turn.chosenWorm.previousPos.x = currentX;

			if (this.machine.turn.chosenWorm.onGround){
				this.machine.turn.chosenWorm.aggregate.body.setGravityFactor(0);
				
				if (this.machine.turn.chosenWorm.canJump && this.keyStatus['w'])
					this.machine.turn?.chosenWorm.jump(-0.65, 6, this.now);
				else if (this.machine.turn?.chosenWorm.canJump && this.keyStatus['e'])
					this.machine.turn?.chosenWorm.jump(2.2, 3, this.now);
				else
				{
					if (this.keyStatus['a'])
						this.machine.turn?.chosenWorm.move(-1, (3 * Math.PI) / 2);
					else if (this.keyStatus['d'])
						this.machine.turn?.chosenWorm.move(1, Math.PI / 2);
					else
						this.machine.turn.chosenWorm.stop();
		
					const currentVel = this.machine.turn.chosenWorm.aggregate.body.getLinearVelocity();
					this.machine.turn.chosenWorm.aggregate.body.setLinearVelocity
					(
						new Vector3
						(
							(this.machine.turn.chosenWorm.dirX * this.machine.turn.chosenWorm.playerSpeed) * this.machine.turn.chosenWorm.isMoving, 
							currentVel.y,
							0
						)
					);
				}
			}
			else
				this.machine.turn.chosenWorm.aggregate.body.setGravityFactor(1);



			if (this.next && this.machine.isActiveUser()) {
				this.machine.sendRequestStatePacket(GameState.AIMING);
				this.next = false;
			}
		});
		return (actions);
	}

	// setCurrentWorm(): Worm {
	// 	// Ensure players exist
	// 	if (!this.machine.players || this.machine.players.length === 0)
	// 		return ;

	// 	// Ensure turn exists
	// 	if (!this.machine.turn) {
	// 		this.machine.turn = new Turn(this.machine.players[0]);
	// 	}

	// 	// Get chosen worm
	// 	let worm = this.machine.turn.chosenWorm;

	// 	// Fallback to first worm
	// 	if (!worm) {
	// 		const firstPlayer = this.machine.players[0];

	// 		if (!firstPlayer.wormscenes || firstPlayer.worms.length === 0) {
	// 			throw new Error("Player has no worms initialized");
	// 		}

	// 		worm = firstPlayer.worms[0];
	// 	}

	// 	return worm;
	// }

	tick() {
		
	}

	exit() {
		this.machine.scene.onBeforePhysicsObservable.remove(this.observer);
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}