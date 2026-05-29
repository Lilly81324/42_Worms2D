import { Player } from '../../player/Player';
import { Worm } from '../../player/Worm';
import { Turn } from '../4_turn_start/Turn';
import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction, AbstractActionManager, Quaternion, Axis, Vector3, Scene, Observer, Observable } from '@babylonjs/core'

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Move with ?, switch weapons with 0-9 then confirm with Space");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} is worming around`);
	}
}

function manuallyChooseWeapon(action: AbstractActionManager, machine: StateMachine) {
	for (let i = 0; i < 9; i++) {
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: `${i + 1}`
		}, () => {
			console.log("Choosing")
			machine.turn?.chooseWeapon(machine.weapons.find((weapon) => (weapon.weaponId == i)));
		}));
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
	constructor(private machine: StateMachine) {}

	enter() {
		this.reset()

		// Setup
		turnMessage(this.machine);

		// Actions
		const action = this.machine.scene.actionManager;

		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser() || !this.machine.turn || !this.machine.players)
			return ;

		manuallyChooseWeapon(action, this.machine);
		this.machine.turn?.chosenWeapon?.show(true);

		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "a"
		}, () => {
			this.keyStatus['a'] = true;
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "a"
		}, () => {
			this.keyStatus['a'] = false;
		}));

		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "d"
		}, () => {
			this.keyStatus['d'] = true;
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "d"
		}, () => {
			this.keyStatus['d'] = false;
		}));

		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "e"
		}, () => {
			this.keyStatus['e'] = true;
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "e"
		}, () => {
			this.keyStatus['e'] = false;
		}));

		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "w"
		}, () => {
			this.keyStatus['w'] = true;
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "w"
		}, () => {
			this.keyStatus['w'] = false;
		}));


		// Confirm movement to be done
		(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
	}

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