import { SC_Type, SC_GenericPacket, frontendServerPackets, SC_ExplosionOccurs } from "@/shared/packets/ServerClientPackets"
import { StateMachine } from '../babylon/state/StateMachine';
import { GameState } from '@/shared/state/GameState';
import { Nullable, Vector3 } from "@babylonjs/core";
import { Control, TextBlock } from "@babylonjs/gui";
import { Player } from "../babylon/player/Player";
import { Worm } from '../babylon/player/Worm';
import { aimStateId } from "@/shared/packets/util";
import { CS_DEV_GameWon, CS_DEV_StaleMate, CS_Type } from "@/shared/packets/ClientServerPackets";

function findWormById(players: Array<Player>, wormId: number): Worm | undefined {
	let worm: Worm | undefined = undefined;
	for (const player of players) {
		worm = player.worms.find((worm) => worm.id == wormId);
		if (worm != undefined) return worm;
	}
	return (undefined)
}

/**
 * Generates random death message with name
 * @param name Name of the worm to die
 * @returns message
 * Credit to https://www.babbel.com/en/magazine/death-euphemisms
 */
function randomDeathMsg(name: string) {
	const messages = [
		`${name} bit the dust`,
		`${name} passed on to the great beyond`,
		`${name} was laid to rest`,
		`${name} departed`,
		`Poor ${name} is no longer with us`,
		`${name} went to a better place`,
		`${name} crossed over`,
		`${name} was annihilated`,
		`${name} kicked the bucket`,
		`${name} bit the dust`,
		`${name} is pushing up daisis`,
		`${name} is now sleeping with the fishies`,
		`Goodbye, ${name}, you will be missed`,
		`${name} expired`,
		`${name} ceased`,
		`${name} slipped away`,
		`${name} lost their life`,
		`${name} left this life`,
		`${name} entered eternal rest`,
		`${name} was called home`,
		`${name} joined their ancestors`,
		`${name} passed beyond the veil`,
		`${name} is in a better place now `,
	]
	const random = Math.round(Math.random() * messages.length);
	return (messages[random - 1]);
}

/**
 * Performs damaging operations on worms, handles killing players and worms too
 * @param data 
 * @param state 
 * @returns 
 */
function damageWorms(data: SC_ExplosionOccurs, state: StateMachine) {
	if (!state.loaded)
		return ;
	const playersDiedThisTurn = new Array<string>();
	const explosionVector = new Vector3(data.point.x, data.point.y, 0);
	state.loaded.players.forEach((player) => {
		if (!state.loaded)
			return ;

		// For all worms
		player.worms.forEach(worm => {

			// Calculate damage
			const distanceToExplosion = Vector3.Distance(explosionVector, worm.collider.position);
			if (distanceToExplosion > data.radius)
				return ;
			worm.gui.health -= 400  *(1 - distanceToExplosion / data.radius);

			// Kill Worms
			if (worm.gui.health > 0)
				return ;
			const index = player.worms.findIndex((findWorm) => findWorm.id == worm.id);
			if (index >= 0) {
				state.guiHelper?.notifications.add(randomDeathMsg(worm.name));
				player.worms[index].dispose();
				player.worms.splice(index, 1);
			}
		});

		// Kill Players
		if (player.worms.length > 0)
			return ;
		const index = state.loaded.players.findIndex((findPlayer) => findPlayer.id == player.id);
		if (index >= 0) {
			playersDiedThisTurn.push(player.id);
			state.guiHelper?.notifications.add(randomDeathMsg(player.name));
			state.loaded.players[index].dispose();
			state.loaded.players.splice(index, 1);
		}
	});
	// WRONG WRONG WRONG, the server should be telling the CLIENT who won
	if (state.loaded.players.length == 1) {
		state.msgToServer<CS_DEV_GameWon>(CS_Type.CS_DEV_GameWon, {
			winnerIds: [state.loaded.players[0].id],
		})
	}
	else if (state.loaded.players.length == 0) {
		state.msgToServer<CS_DEV_GameWon>(CS_Type.CS_DEV_GameWon, {
			winnerIds: playersDiedThisTurn,
		})
	}
}

export function handlePacket(data: SC_GenericPacket, state: StateMachine) {
	// Ignore Frontend Packets
	if (frontendServerPackets.find((type: SC_Type) => (type == data.type)))
		return ;
	switch (data.type) {
		case SC_Type.SC_DEV_GameState : {
			const text: Nullable<Control> | undefined = state.guiHelper?.textGui.getControlByName("get_state");
			if (text) {
				(text as TextBlock).text = `Current State: ${data.gameState}`;
			}
			state.setState(data.gameState as GameState);
			break ;
		}
		case SC_Type.SC_GameData : {
			state.load(data.data);
			break ;
		}
		case SC_Type.SC_ActivePlayerChanged : {
			state.activePlayerId = data.activeId;
			break ;
		}
		case SC_Type.SC_WormChosen : {
			if (!state.loaded)
				return ;
			const target = findWormById(state.loaded.players, data.wormId);
			if (state.loaded.turn && target != undefined)
				state.loaded.turn.chosenWorm = target;
			break ;
		}
		case SC_Type.SC_WeaponChosen : {
			if (!state.loaded)
				return ;
			state.loaded.turn.chooseWeapon(
				state.loaded.weapons.find(
					(weapon) => (weapon.weaponId == data.id)
				)
			);
			break ;
		}
		// Turn Worms Weapon
		case SC_Type.SC_AimAngle : {
			if (!state.loaded)
				return ;
			state.loaded.turn.turnWeapon(data.angle);
			break ;
		}
		// Turn Target Direction Markers Angle
		case SC_Type.SC_AimTargetAngle : {
			if (!state.loaded)
				return ;
			state.loaded.turn.turnDirection(data.angle);
			break ;
		}
		case SC_Type.SC_AimMoveTarget : {
			if (!state.loaded)
				return ;
			state.loaded.aiming.target.mesh.position.x = data.point.x;
			state.loaded.aiming.target.mesh.position.y = data.point.y;
			break ;
		}
		case SC_Type.SC_SwitchAimState : {
			if (!state.loaded)
				return ;
			const aim = state.loaded.turn.aiming;
			if (data.entering == true) {
				if (data.stateId == aimStateId.PianoPickPosition) {
					aim.target.show(true);
					aim.tail.activate();
				}
				else if (data.stateId == aimStateId.PickPosition) {
					aim.target.show(true);
				}
				else if (data.stateId == aimStateId.SwitchTargetAngle) {
					aim.target.show(true);
					aim.direction.setEnabled(true);
					aim.direction.position.copyFrom(aim.target.mesh.position);
				}
			}
			else {
				aim.target.show(false);
				aim.direction.setEnabled(false);
			}
			break ;
		}
		case SC_Type.SC_CancelAiming : {
			if (!state.loaded)
				return ;
			state.loaded.turn.cancelAiming = true;
			break ;
		}
		case SC_Type.SC_ExplosionOccurs: {
			console.log("Handling Explosion");
			if (state.state != GameState.TURN_END)
				break ;
			damageWorms(data, state);
			state.loaded?.ground?.affectTerrain(data.point.x, data.point.y, data.radius);
			break ;
		}
		default : {
			console.log("BABYLON> Received unhandled type: ", data.type);
		}
	}
}