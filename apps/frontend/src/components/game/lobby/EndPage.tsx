import { CS_DEV_StartLobby, CS_Type } from '@/shared/packets/ClientServerPackets';
import { useGameContext } from './GameContext';

function generateResponse(id: string, winners: Array<string>) {
  if (winners.length > 1)
    return ("Stalemate");
  if (winners.find((findId) => findId == id))
    return ("You win!");
  return ("You lose!");
}

/**
 * Component for page, where the Clients may connect to a Lobby,
 * switch their readines and potentiallyh alter some settings
 * @param msgToServer function for sending packet to server
 */
export default function EndPage() {
  const { msgToServer, winners, userId } = useGameContext();
  const response = generateResponse(userId, winners);
  return (
    <div>
      <h1 className="text-red-500">End Screen</h1>
      <h1 className={response}></h1>
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
        () => {
          msgToServer<CS_DEV_StartLobby>(CS_Type.CS_DEV_StartLobby, {});
        }
      }>Start Game</button>
    </div>
    );
}
