import { Socket } from 'socket.io-client';
import LobbyPage from '@/src/components/game/lobby/LobbyPage';
import LoadingPage from '@/src/components/game/lobby/LoadingPage';
import BabylonCanvas from "@/src/components/game/babylon/Babyloncanvas";
import EndPage from "@/src/components/game/lobby/EndPage";
import ErrorPage from '@/src/components/game/lobby/ErrorPage';
import ConnectingPage from '@/src/components/game/lobby/ConnectingPage';
import type { msgToServerType } from '@/lib/packets/msgToServerType';
import {PlayerSlot} from "@/app/(game)/game/page";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Params {
  state: string,
  msgToServer: msgToServerType,
  slots: PlayerSlot[];
  socket: Socket,
  isConnected: boolean,
  DEBUG: boolean,
  currentUserId: string
}

/**
 * Component that serves different Components,
 * based on the given state
 * @param state string that specifies State
 * @param msgToServer function for sending packet to server
 * @param socket Socket.io Socket object for Babylon Canvas
 * @param isConnected boolean, wether socket connection is established
 * @param DEBUG boolean wether Debug messages should be printed
 */
export default function SubPages({
  state,
  msgToServer,
  socket,
  isConnected,
  DEBUG,
  slots,
  currentUserId
}: Params) {

  // Define which states should have the Header/Footer
  const showFullLayout = ['LOBBY', 'ENDSCREEN'].includes(state);

  // helper function to prevent immediately render
  const renderContent = () => {
    if (state === 'CONNECTING') {
      return <ConnectingPage msgToServer={msgToServer} isConnected={isConnected}/>
    }
    if (state === 'LOBBY') {
      return <LobbyPage msgToServer={msgToServer} players={slots} currentUserId={currentUserId}/>
    }
    if (state === 'LOADING') {
      return <LoadingPage msgToServer={msgToServer}/>
    }
    if (state === 'GAME') {
      return <BabylonCanvas msgToServer={msgToServer} socket={socket} DEBUG={DEBUG}/>
    }
    if (state === 'ENDSCREEN') {
      return <EndPage msgToServer={msgToServer}/>
    }
    return <ErrorPage />;
  };

  return (
      <div className="flex flex-col min-h-screen">
        {showFullLayout && <Header />}

        <div className="flex-grow">
          {renderContent()}
        </div>

        {showFullLayout && <Footer />}
      </div>
  );
}
