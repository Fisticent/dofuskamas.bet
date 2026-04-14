import React, { useState, useEffect, useRef } from 'react';
import { Coins, Users, Play, Settings, Dices, Trophy, AlignLeft, Skull, Crosshair, RefreshCw, Shield, Zap, ArrowUpCircle, Sword, Footprints, Volume2, VolumeX, History, Bomb, Droplets, Swords, Percent, Info, User, Wallet, CheckCircle, PlusCircle, CreditCard, ArrowDownRight, ArrowUpRight, Download, Activity } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { EVENT_TYPES, EVENT_DESCRIPTIONS } from './constants';
import { playSound, initAudio, setAmbientDrone } from './audio';

const App = () => {
  const [participants, setParticipants] = useState([
    "Iop-Destructeur", "Cra-Sniper", "Eni-Soins", "Sram-Furtif", "Xelor-Mage",
    "Sacri-Tank", "Osa-Invoc", "Feca-Bouclier", "Eca-Chance", "Sadida-Ronce"
  ]);
  const [bulkInput, setBulkInput] = useState(participants.join('\n'));
  const [kamaPrize, setKamaPrize] = useState(0); // Commence à 0 car les joueurs abondent
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Navigation
  const [activeTab, setActiveTab] = useState('config'); 
  const [ardoiseView, setArdoiseView] = useState('mises'); // 'mises' ou 'gains'
  const [showOdds, setShowOdds] = useState(true);
  
  // États du jeu
  const [alivePlayers, setAlivePlayers] = useState([...participants]);
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [shieldedPlayers, setShieldedPlayers] = useState([]);
  const [potatoHolder, setPotatoHolder] = useState(null);
  const [bloodPact, setBloodPact] = useState(null);
  
  // États Financiers
  const [sessionHistory, setSessionHistory] = useState([]); // Gains à payer
  const [contributions, setContributions] = useState([]); // Mises à récolter
  const [selectedContributor, setSelectedContributor] = useState("");
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [screenEffect, setScreenEffect] = useState(null); 
  
  // Overlays
  const [assassinTargeting, setAssassinTargeting] = useState(null); 
  const [pactChooser, setPactChooser] = useState(null);
  const [pactSelection, setPactSelection] = useState([]);
  const [duelState, setDuelState] = useState(null); 
  const [gameMode, setGameMode] = useState('pvp');
  const [bossHp, setBossHp] = useState(1000);
  const [maxBossHp, setMaxBossHp] = useState(1000);
  const ardoiseRef = useRef(null);
  
  // Configuration des bonus
  const [activeEvents, setActiveEvents] = useState({
    shield: true, resurrect: true, carnage: true, 
    assassin: true, thief: true, duel: true, potato: true, pact: true
  });
  
  const [eventWeights, setEventWeights] = useState({
    shield: 8, resurrect: 5, carnage: 5, 
    assassin: 5, thief: 4, duel: 5, potato: 5, pact: 5
  });
  
  // États pour la roue
  const [wheelItems, setWheelItems] = useState([]);
  const [spinStyles, setSpinStyles] = useState({ transform: 'translateX(-88px)', transition: 'none' });
  const isSpinningRef = useRef(false);

  useEffect(() => { initGame(participants); }, [participants]);

  // S'assurer qu'un joueur est toujours sélectionné pour la mise
  useEffect(() => {
    if (alivePlayers.length > 0 && !alivePlayers.includes(selectedContributor)) {
      setSelectedContributor(alivePlayers[0]);
    }
  }, [alivePlayers, selectedContributor]);

  const resetGlobal = () => {
    if (window.confirm("Êtes-vous sûr de vouloir TOUT réinitialiser (Cagnotte, Historique, Dettes, Rôles) ?")) {
      setKamaPrize(0);
      setContributions([]);
      setSessionHistory([]);
      initGame(participants);
    }
  };

  const initGame = (list) => {
    setAlivePlayers([...list]); setEliminatedPlayers([]); setShieldedPlayers([]);
    setPotatoHolder(null); setBloodPact(null); setWinner(null); setLastEvent(null);
    setAssassinTargeting(null); setPactChooser(null); setPactSelection([]); setDuelState(null); setScreenEffect(null);
    setBossHp(list.length * 100); setMaxBossHp(list.length * 100);
    setKamaPrize(0);
    if (list.length > 0) {
      const items = Array(15).fill(null).map(() => generateRandomWheelItem(list, activeEvents));
      setWheelItems(items);
      setSpinStyles({ transform: 'translateX(-88px)', transition: 'none' });
    }
  };

  const handleUpdateParticipants = () => {
    const newList = bulkInput.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    setParticipants([...new Set(newList)]);
  };

  const formatKamas = (amount) => new Intl.NumberFormat('fr-FR').format(amount);

  // --- GESTION DES FONDS ---
  const handleAddContribution = (amount) => {
    if (!selectedContributor) return;
    setKamaPrize(prev => prev + amount);
    setContributions(prev => [{
      id: Date.now(),
      player: selectedContributor,
      amount: amount,
      paid: false,
      date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }, ...prev]);
    playSound('coin', soundEnabled);
  };

  // --- EVENEMENTS VISUELS ---
  const triggerScreenEffect = (type) => {
    setScreenEffect(type);
    setTimeout(() => setScreenEffect(null), 1000);
  };

  const generateRandomWheelItem = (aliveList, currentActiveEvents = activeEvents, currentWeights = eventWeights) => {
    const possibleEvents = [{ type: 'player', weight: 60 }];
    if (currentActiveEvents.jackpot) possibleEvents.push({ type: EVENT_TYPES.JACKPOT, weight: currentWeights.jackpot });
    if (currentActiveEvents.shield) possibleEvents.push({ type: EVENT_TYPES.SHIELD, weight: currentWeights.shield });
    if (currentActiveEvents.resurrect) possibleEvents.push({ type: EVENT_TYPES.RESURRECT, weight: currentWeights.resurrect });
    if (currentActiveEvents.carnage) possibleEvents.push({ type: EVENT_TYPES.CARNAGE, weight: currentWeights.carnage });
    if (currentActiveEvents.assassin) possibleEvents.push({ type: EVENT_TYPES.ASSASSIN, weight: currentWeights.assassin });
    if (currentActiveEvents.thief) possibleEvents.push({ type: EVENT_TYPES.THIEF, weight: currentWeights.thief });
    if (currentActiveEvents.duel && aliveList.length >= 2) possibleEvents.push({ type: EVENT_TYPES.DUEL, weight: currentWeights.duel });
    if (currentActiveEvents.potato && aliveList.length >= 3 && !potatoHolder) possibleEvents.push({ type: EVENT_TYPES.POTATO, weight: currentWeights.potato });
    if (currentActiveEvents.pact && aliveList.length >= 4 && !bloodPact) possibleEvents.push({ type: EVENT_TYPES.PACT, weight: currentWeights.pact });

    if (gameMode === 'pvm') {
      possibleEvents.push({ type: EVENT_TYPES.PVM_PLAYER_ATTACK, weight: 20 });
      possibleEvents.push({ type: EVENT_TYPES.PVM_BOSS_ATTACK, weight: 15 });
      if (eliminatedPlayers.length > 0) possibleEvents.push({ type: EVENT_TYPES.PVM_HEAL_GROUP, weight: 10 });
    }

    const totalWeight = possibleEvents.reduce((sum, e) => sum + e.weight, 0);
    let r = Math.random() * totalWeight;
    let type = 'player';
    for (let e of possibleEvents) { if (r < e.weight) { type = e.type; break; } r -= e.weight; }

    if (type === EVENT_TYPES.SHIELD) return { type: EVENT_TYPES.SHIELD, text: '🛡️ BOUCLIER FECA' };
    if (type === EVENT_TYPES.RESURRECT) return { type: EVENT_TYPES.RESURRECT, text: '🧟 LAISSE SPIRITUELLE' };
    if (type === EVENT_TYPES.CARNAGE) return { type: EVENT_TYPES.CARNAGE, text: '☠️ COLÈRE DE IOP' };
    if (type === EVENT_TYPES.ASSASSIN) return { type: EVENT_TYPES.ASSASSIN, text: '🗡️ ATTAQUE MORTELLE' };
    if (type === EVENT_TYPES.THIEF) return { type: EVENT_TYPES.THIEF, text: '🏃‍♂️ ARNAQUE' };
    if (type === EVENT_TYPES.DUEL) return { type: EVENT_TYPES.DUEL, text: '⚔️ DUEL DE IOP' };
    if (type === EVENT_TYPES.POTATO) return { type: EVENT_TYPES.POTATO, text: '💣 BOMBE AMBULANTE' };
    if (type === EVENT_TYPES.PACT) return { type: EVENT_TYPES.PACT, text: '🩸 PACTE DE SANG' };
    if (type === EVENT_TYPES.PVM_PLAYER_ATTACK) return { type: EVENT_TYPES.PVM_PLAYER_ATTACK, text: '⚔️ GROUPE ATTAQUE' };
    if (type === EVENT_TYPES.PVM_BOSS_ATTACK) return { type: EVENT_TYPES.PVM_BOSS_ATTACK, text: '👿 BOSS ATTAQUE' };
    if (type === EVENT_TYPES.PVM_HEAL_GROUP) return { type: EVENT_TYPES.PVM_HEAL_GROUP, text: '✨ MOT RECONSTITUTION' };
    
    return { type: 'player', text: aliveList[Math.floor(Math.random() * aliveList.length)] };
  };

  const triggerWinner = (winningPlayer, currentPrize) => {
    setWinner(winningPlayer);
    playSound('win', soundEnabled);
    setSessionHistory(prev => [{ id: Date.now(), winner: winningPlayer, prize: currentPrize, date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), paid: false, type: 'win' }, ...prev]);
  };

  const processDeath = (victim, currentAlive, currentEliminated, currentShields) => {
    let toProcess = [victim];
    let actuallyDied = [];
    let logs = [];

    if (bloodPact && bloodPact.includes(victim)) {
      const partner = bloodPact.find(p => p !== victim);
      if (partner && currentAlive.includes(partner) && !toProcess.includes(partner)) {
        toProcess.push(partner);
        logs.push(`🩸 Le Pacte de Sang entraîne ${partner} dans la chute !`);
      }
    }

    toProcess.forEach(p => {
      if (currentShields.includes(p)) {
        currentShields = currentShields.filter(s => s !== p);
        logs.push(`🛡️ Le Bouclier Feca a sauvé ${p} !`);
        playSound('divine', soundEnabled);
      } else {
        currentAlive = currentAlive.filter(a => a !== p);
        currentEliminated = [p, ...currentEliminated];
        actuallyDied.push(p);
      }
    });

    return { newAlive: currentAlive, newEliminated: currentEliminated, newShields: currentShields, actuallyDied, logs };
  };

  // --- LOGIQUE DE ROULETTE ---
  const spinForElimination = () => {
    if (alivePlayers.length < 2) return;
    initAudio();
    setIsSpinning(true); isSpinningRef.current = true; setLastEvent(null);

    let elapsed = 0; let delay = 20;
    const tickLoop = () => {
      if (elapsed > 4500 || !isSpinningRef.current) return;
      playSound('tick', soundEnabled); elapsed += delay; delay *= 1.08; setTimeout(tickLoop, delay);
    };
    tickLoop();

    let isPotatoExploding = false;
    let chosenEvent = EVENT_TYPES.ELIMINATION;
    let eventData = {};

    if (potatoHolder) {
      if (Math.random() < 0.5) {
        isPotatoExploding = true;
        chosenEvent = EVENT_TYPES.POTATO_EXPLODE;
        eventData.victim = potatoHolder;
      } else {
        const others = alivePlayers.filter(p => p !== potatoHolder);
        const newHolder = others[Math.floor(Math.random() * others.length)];
        setPotatoHolder(newHolder);
        playSound('tick', soundEnabled);
      }
    }

    if (!isPotatoExploding) {
      const possibleEvents = [{ type: EVENT_TYPES.ELIMINATION, weight: 60 }];
      if (activeEvents.shield) possibleEvents.push({ type: EVENT_TYPES.SHIELD, weight: eventWeights.shield });
      if (activeEvents.resurrect && eliminatedPlayers.length > 0) possibleEvents.push({ type: EVENT_TYPES.RESURRECT, weight: eventWeights.resurrect });
      if (activeEvents.carnage && alivePlayers.length >= 3) possibleEvents.push({ type: EVENT_TYPES.CARNAGE, weight: eventWeights.carnage });
      if (activeEvents.assassin && alivePlayers.length >= 3) possibleEvents.push({ type: EVENT_TYPES.ASSASSIN, weight: eventWeights.assassin });
      if (activeEvents.thief) possibleEvents.push({ type: EVENT_TYPES.THIEF, weight: eventWeights.thief });
      if (activeEvents.duel && alivePlayers.length >= 2) possibleEvents.push({ type: EVENT_TYPES.DUEL, weight: eventWeights.duel });
      if (activeEvents.potato && alivePlayers.length >= 3 && !potatoHolder) possibleEvents.push({ type: EVENT_TYPES.POTATO, weight: eventWeights.potato });
      if (activeEvents.pact && alivePlayers.length >= 4 && !bloodPact) possibleEvents.push({ type: EVENT_TYPES.PACT, weight: eventWeights.pact });

      if (gameMode === 'pvm') {
        possibleEvents.push({ type: EVENT_TYPES.PVM_PLAYER_ATTACK, weight: 20 });
        possibleEvents.push({ type: EVENT_TYPES.PVM_BOSS_ATTACK, weight: 15 });
        if (eliminatedPlayers.length > 0) possibleEvents.push({ type: EVENT_TYPES.PVM_HEAL_GROUP, weight: 10 });
      }

      const totalWeight = possibleEvents.reduce((sum, e) => sum + e.weight, 0);
      let roll = Math.random() * totalWeight;
      for (let e of possibleEvents) { if (roll < e.weight) { chosenEvent = e.type; break; } roll -= e.weight; }
    }

    let targetWheelItem = {};
    if (chosenEvent === EVENT_TYPES.POTATO_EXPLODE) targetWheelItem = { type: EVENT_TYPES.POTATO_EXPLODE, text: `💣 ${eventData.victim}` };
    else if (chosenEvent === EVENT_TYPES.SHIELD) { eventData.lucky = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]; targetWheelItem = { type: EVENT_TYPES.SHIELD, text: '🛡️ BOUCLIER FECA' }; } 
    else if (chosenEvent === EVENT_TYPES.RESURRECT) { eventData.revived = eliminatedPlayers[Math.floor(Math.random() * eliminatedPlayers.length)]; targetWheelItem = { type: EVENT_TYPES.RESURRECT, text: '🧟 LAISSE SPIRITUELLE' }; } 
    else if (chosenEvent === EVENT_TYPES.CARNAGE) { const shuffled = [...alivePlayers].sort(() => 0.5 - Math.random()); eventData.victims = [shuffled[0], shuffled[1]]; targetWheelItem = { type: EVENT_TYPES.CARNAGE, text: '☠️ COLÈRE DE IOP' }; } 
    else if (chosenEvent === EVENT_TYPES.ASSASSIN) { eventData.assassin = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]; targetWheelItem = { type: EVENT_TYPES.ASSASSIN, text: '🗡️ ATTAQUE MORTELLE' }; } 
    else if (chosenEvent === EVENT_TYPES.THIEF) { eventData.thief = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]; targetWheelItem = { type: EVENT_TYPES.THIEF, text: '🏃‍♂️ ARNAQUE' }; } 
    else if (chosenEvent === EVENT_TYPES.DUEL) { const shuffled = [...alivePlayers].sort(() => 0.5 - Math.random()); eventData.p1 = shuffled[0]; eventData.p2 = shuffled[1]; targetWheelItem = { type: EVENT_TYPES.DUEL, text: '⚔️ DUEL DE IOP' }; }
    else if (chosenEvent === EVENT_TYPES.POTATO) { eventData.target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]; targetWheelItem = { type: EVENT_TYPES.POTATO, text: '💣 BOMBE AMBULANTE' }; }
    else if (chosenEvent === EVENT_TYPES.PACT) { eventData.pactMaker = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]; targetWheelItem = { type: EVENT_TYPES.PACT, text: '🩸 PACTE DE SANG' }; }
    else if (chosenEvent === EVENT_TYPES.PVM_PLAYER_ATTACK) { eventData.damage = Math.floor(Math.random() * 80) + 20; targetWheelItem = { type: EVENT_TYPES.PVM_PLAYER_ATTACK, text: '⚔️ GROUPE ATTAQUE' }; }
    else if (chosenEvent === EVENT_TYPES.PVM_BOSS_ATTACK) { eventData.victim = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]; targetWheelItem = { type: EVENT_TYPES.PVM_BOSS_ATTACK, text: '👿 BOSS ATTAQUE' }; }
    else if (chosenEvent === EVENT_TYPES.PVM_HEAL_GROUP) { eventData.revived = eliminatedPlayers[Math.floor(Math.random() * eliminatedPlayers.length)]; targetWheelItem = { type: EVENT_TYPES.PVM_HEAL_GROUP, text: '✨ MOT RECONSTITUTION' }; }
    else { chosenEvent = EVENT_TYPES.ELIMINATION; eventData.victim = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]; targetWheelItem = { type: 'player', text: eventData.victim }; }

    const targetIndex = 50;
    const newWheel = [];
    for (let i = 0; i < 65; i++) {
      if (i === targetIndex) newWheel.push(targetWheelItem);
      else newWheel.push(generateRandomWheelItem(alivePlayers, activeEvents, eventWeights));
    }
    setWheelItems(newWheel);
    setSpinStyles({ transition: 'none', transform: 'translateX(-88px)' });

    setTimeout(() => {
      const itemWidth = 176; const randomJitter = Math.floor(Math.random() * 120) - 60; 
      setSpinStyles({ transition: 'transform 4.5s cubic-bezier(0.05, 0.9, 0.1, 1)', transform: `translateX(calc(-${targetIndex * itemWidth}px - 88px + ${randomJitter}px))` });

      setTimeout(() => {
        isSpinningRef.current = false;
        let currentKamas = kamaPrize;
        let pData = { newAlive: [...alivePlayers], newEliminated: [...eliminatedPlayers], newShields: [...shieldedPlayers], actuallyDied: [], logs: [] };

        if (chosenEvent === EVENT_TYPES.POTATO_EXPLODE) {
          pData = processDeath(eventData.victim, pData.newAlive, pData.newEliminated, pData.newShields);
          setPotatoHolder(null);
          setLastEvent({ type: 'carnage', message: `💣 LA BOMBE AMBULANTE A EXPLOSÉ SUR ${eventData.victim} ! ${pData.logs.join(' ')}` });
          triggerScreenEffect('explosion'); playSound('explosion', soundEnabled);
        }
        else if (chosenEvent === EVENT_TYPES.ELIMINATION) {
          pData = processDeath(eventData.victim, pData.newAlive, pData.newEliminated, pData.newShields);
          if (pData.actuallyDied.length > 0) { setLastEvent({ type: 'kill', message: `💀 ${eventData.victim} est éliminé ! ${pData.logs.join(' ')}` }); triggerScreenEffect('blood'); playSound('explosion', soundEnabled); }
          else { setLastEvent({ type: 'shield_break', message: pData.logs[0] }); }
        }
        else if (chosenEvent === EVENT_TYPES.SHIELD) {
          if (!pData.newShields.includes(eventData.lucky)) pData.newShields.push(eventData.lucky);
          setLastEvent({ type: 'bonus', message: `🛡️ ${eventData.lucky} obtient un Bouclier Feca !` }); playSound('divine', soundEnabled);
        }
        else if (chosenEvent === EVENT_TYPES.RESURRECT) {
          pData.newEliminated = pData.newEliminated.filter(p => p !== eventData.revived); pData.newAlive.push(eventData.revived);
          setLastEvent({ type: 'resurrect', message: `🧟 LAISSE SPIRITUELLE ! ${eventData.revived} revient à la vie !` }); playSound('divine', soundEnabled);
        }
        else if (chosenEvent === EVENT_TYPES.CARNAGE) {
          eventData.victims.forEach(v => {
            const res = processDeath(v, pData.newAlive, pData.newEliminated, pData.newShields);
            pData.newAlive = res.newAlive; pData.newEliminated = res.newEliminated; pData.newShields = res.newShields;
            pData.actuallyDied.push(...res.actuallyDied); pData.logs.push(...res.logs);
          });
          setLastEvent({ type: 'carnage', message: `☠️ COLÈRE DE IOP SUR ${eventData.victims.join(' & ')} ! ${pData.logs.join(' ')}` });
          triggerScreenEffect('fire'); playSound('explosion', soundEnabled);
        }
        else if (chosenEvent === EVENT_TYPES.THIEF) {
          const stolen = Math.floor(currentKamas * 0.33); currentKamas -= stolen; setKamaPrize(currentKamas);
          pData.newAlive = pData.newAlive.filter(p => p !== eventData.thief);
          pData.newEliminated = [eventData.thief, ...pData.newEliminated];
          setLastEvent({ type: 'thief', message: `🏃‍♂️ ${eventData.thief} (Arnaque) s'enfuit avec ${formatKamas(stolen)} K !` }); playSound('coin', soundEnabled);
          setSessionHistory(prev => [{ id: Date.now(), winner: eventData.thief, prize: stolen, date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), paid: false, type: 'thief' }, ...prev]);
        }
        else if (chosenEvent === EVENT_TYPES.POTATO) {
          setPotatoHolder(eventData.target);
          setLastEvent({ type: 'potato', message: `💣 ${eventData.target} REÇOIT LA BOMBE AMBULANTE !` }); playSound('divine', soundEnabled);
        }
        else if (chosenEvent === EVENT_TYPES.PACT) {
          setPactChooser(eventData.pactMaker);
          setPactSelection([]);
          setLastEvent({ type: 'pact', message: `🩸 ${eventData.pactMaker} PRÉPARE UN PACTE DE SANG !` }); playSound('divine', soundEnabled);
        }
        else if (chosenEvent === EVENT_TYPES.PVM_PLAYER_ATTACK) {
           let dmg = eventData.damage;
           setBossHp(prev => {
             const newHp = Math.max(0, prev - dmg);
             if (newHp === 0 && pData.newAlive.length > 0) setWinner('LE GROUPE (LE BOSS EST VAINCU !)');
             return newHp;
           });
           setLastEvent({ type: 'carnage', message: `⚔️ LE GROUPE INFLIGE ${dmg} DEGATS AU BOSS !` });
           triggerScreenEffect('slash'); playSound('slash', soundEnabled);
        }
        else if (chosenEvent === EVENT_TYPES.PVM_BOSS_ATTACK) {
           pData = processDeath(eventData.victim, pData.newAlive, pData.newEliminated, pData.newShields);
           setLastEvent({ type: 'kill', message: `👿 LE BOSS APPLIQUE SON EFFET SUR ${eventData.victim} ! ${pData.logs.join(' ')}` });
           triggerScreenEffect('blood'); playSound('explosion', soundEnabled);
        }
        else if (chosenEvent === EVENT_TYPES.PVM_HEAL_GROUP) {
           pData.newEliminated = pData.newEliminated.filter(p => p !== eventData.revived);
           pData.newAlive.push(eventData.revived);
           pData.newShields.push(eventData.revived);
           setLastEvent({ type: 'resurrect', message: `✨ ${eventData.revived} REVIENT À LA VIE AVEC UN BOUCLIER !` });
           triggerScreenEffect('shield_break'); playSound('divine', soundEnabled);
        }

        setAlivePlayers(pData.newAlive); setEliminatedPlayers(pData.newEliminated); setShieldedPlayers(pData.newShields);
        setIsSpinning(false);

        if (chosenEvent === EVENT_TYPES.ASSASSIN) {
          setLastEvent({ type: 'assassin', message: `🗡️ ${eventData.assassin} PRÉPARE UNE ATTAQUE MORTELLE !` }); playSound('divine', soundEnabled);
          setAssassinTargeting(eventData.assassin);
        } else if (chosenEvent === EVENT_TYPES.DUEL) {
          setLastEvent({ type: 'duel', message: `⚔️ DUEL DE IOP ENTRE ${eventData.p1} ET ${eventData.p2} !` }); playSound('slash', soundEnabled);
          setDuelState({ p1: eventData.p1, p2: eventData.p2, p1Hp: 100, p2Hp: 100, resolving: false, phase: 'idle', countdownText: '' });
        } else {
          checkWinCondition(pData.newAlive, currentKamas);
        }
      }, 4800);
    }, 50);
  };

  const handleAssassinKill = (victim) => {
    let pData = processDeath(victim, alivePlayers, eliminatedPlayers, shieldedPlayers);
    setLastEvent({ type: 'kill', message: `🗡️ ${assassinTargeting} a frappé ${victim}. ${pData.logs.join(' ')}` });
    if (pData.actuallyDied.length > 0) triggerScreenEffect('slash');
    playSound('slash', soundEnabled);
    
    setAlivePlayers(pData.newAlive); setEliminatedPlayers(pData.newEliminated); setShieldedPlayers(pData.newShields);
    setAssassinTargeting(null);
    checkWinCondition(pData.newAlive, kamaPrize);
  };

  const finishDuel = (loserName) => {
    let pData = processDeath(loserName, alivePlayers, eliminatedPlayers, shieldedPlayers);
    setLastEvent({ type: 'kill', message: `⚔️ ${loserName} a succombé au combat final ! ${pData.logs.join(' ')}` });
    
    setAlivePlayers(pData.newAlive); setEliminatedPlayers(pData.newEliminated); setShieldedPlayers(pData.newShields);
    setDuelState(null);
    checkWinCondition(pData.newAlive, kamaPrize);
  };

  const triggerFightStep = (hp1, hp2, p1, p2) => {
    setDuelState(prev => ({ ...prev, attacker: null, hitTarget: null }));

    setTimeout(() => {
      const isP1Attacking = Math.random() < 0.5;
      const damage = Math.floor(Math.random() * 25) + 15; 
      let nextP1Hp = hp1; let nextP2Hp = hp2;

      if (isP1Attacking) nextP2Hp = Math.max(0, hp2 - damage);
      else nextP1Hp = Math.max(0, hp1 - damage);

      if (nextP1Hp === 0 || nextP2Hp === 0) {
        setDuelState(prev => ({ ...prev, phase: 'suspense', attacker: isP1Attacking ? 'p1' : 'p2' }));
        playSound('heartbeat', soundEnabled);
        let beats = 0;
        const heartLoop = setInterval(() => {
          beats++;
          if (beats < 3) playSound('heartbeat', soundEnabled);
          else clearInterval(heartLoop);
        }, 800);

        setTimeout(() => {
          setDuelState(prev => ({ ...prev, p1Hp: nextP1Hp, p2Hp: nextP2Hp, hitTarget: isP1Attacking ? 'p2' : 'p1', phase: 'dead' }));
          playSound('slash', soundEnabled); playSound('explosion', soundEnabled); triggerScreenEffect('slash');
          setTimeout(() => {
            const loserName = nextP1Hp === 0 ? p1 : p2;
            setDuelState(prev => ({ ...prev, hitTarget: null, loser: loserName }));
            setTimeout(() => finishDuel(loserName), 2000);
          }, 1000);
        }, 3000);
        return;
      }
      setDuelState(prev => ({ ...prev, p1Hp: nextP1Hp, p2Hp: nextP2Hp, hitTarget: isP1Attacking ? 'p2' : 'p1', attacker: isP1Attacking ? 'p1' : 'p2' }));
      playSound('slash', soundEnabled);
      setTimeout(() => triggerFightStep(nextP1Hp, nextP2Hp, p1, p2), 900);
    }, 50); 
  };

  const resolveDuel = () => {
    const { p1, p2 } = duelState;
    setDuelState(prev => ({ ...prev, resolving: true, phase: 'countdown', countdownText: '3' }));
    playSound('tick', soundEnabled);
    setTimeout(() => { setDuelState(prev => ({...prev, countdownText: '2'})); playSound('tick', soundEnabled); }, 1000);
    setTimeout(() => { setDuelState(prev => ({...prev, countdownText: '1'})); playSound('tick', soundEnabled); }, 2000);
    setTimeout(() => {
      setDuelState(prev => ({...prev, countdownText: 'COMBAT !', phase: 'fighting'}));
      playSound('explosion', soundEnabled);
      setTimeout(() => triggerFightStep(100, 100, p1, p2), 1000);
    }, 3000);
  };

  const checkWinCondition = (currentAlive, prize) => {
    if (currentAlive.length === 2 && bloodPact && bloodPact.includes(currentAlive[0]) && bloodPact.includes(currentAlive[1])) {
      triggerWinner(`${currentAlive[0]} & ${currentAlive[1]} (Pacte de Sang)`, prize * 2);
    } else if (currentAlive.length === 1) {
      triggerWinner(currentAlive[0], prize);
    } else if (currentAlive.length === 0) {
      triggerWinner("PERSONNE (Tout le monde est mort !)", 0);
    }
  };

  const getWheelItemClass = (item, isTarget) => {
    let base = "w-40 h-24 flex-shrink-0 flex items-center justify-center p-2 text-center whitespace-normal leading-tight font-bold text-base md:text-lg rounded-md transition-colors duration-200 border ";
    if (isTarget) return base + "scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)] z-10 bg-white text-black border-white";
    switch(item.type) {
      case 'player': return base + "bg-[#2f4553] text-[#b1bad3] border-[#3d5668]";
      case EVENT_TYPES.POTATO_EXPLODE: return base + "bg-red-600 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)]";
      case EVENT_TYPES.JACKPOT: return base + "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case EVENT_TYPES.SHIELD: return base + "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case EVENT_TYPES.RESURRECT: return base + "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case EVENT_TYPES.CARNAGE: return base + "bg-red-600/20 text-red-500 border-red-500/50";
      case EVENT_TYPES.ASSASSIN: return base + "bg-purple-600/20 text-purple-400 border-purple-500/50";
      case EVENT_TYPES.THIEF: return base + "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case EVENT_TYPES.DUEL: return base + "bg-gray-800 text-white border-gray-400";
      case EVENT_TYPES.POTATO: return base + "bg-red-900/40 text-red-300 border-red-600";
      case EVENT_TYPES.PACT: return base + "bg-rose-900/40 text-rose-300 border-rose-600";
      case EVENT_TYPES.PVM_BOSS_ATTACK: return base + "bg-purple-900/60 text-purple-200 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]";
      case EVENT_TYPES.PVM_PLAYER_ATTACK: return base + "bg-sky-900/60 text-sky-200 border-sky-500";
      case EVENT_TYPES.PVM_HEAL_GROUP: return base + "bg-green-900/60 text-green-200 border-green-500";
      default: return base + "bg-[#2f4553] text-[#b1bad3]";
    }
  };

  const isTension = alivePlayers.length <= 3 && alivePlayers.length > 1 && !winner && !assassinTargeting && !duelState;

  const exportBilanImage = () => {
    if (ardoiseRef.current) {
      htmlToImage.toPng(ardoiseRef.current, { backgroundColor: '#1a2c38' })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `bilan_kamas_${new Date().getTime()}.png`;
          link.href = dataUrl;
          link.click();
        });
    }
  };

  const calculateSettlements = () => {
    let balances = {};
    const allPlayers = [...new Set([...alivePlayers, ...eliminatedPlayers, ...contributions.map(c => c.player), ...sessionHistory.map(h => h.winner)])];
    
    allPlayers.forEach(p => balances[p] = 0);

    contributions.forEach(c => {
      if (balances[c.player] !== undefined) balances[c.player] -= c.amount;
    });

    sessionHistory.forEach(h => {
      let winners = [h.winner];
      if (h.winner.includes('&')) {
        winners = h.winner.split('&').map(w => w.split('(')[0].trim());
      }
      const splitAmount = Math.floor(h.prize / winners.length);
      winners.forEach(w => {
        if (balances[w] !== undefined) balances[w] += splitAmount;
      });
    });

    let debtors = [];
    let creditors = [];
    Object.keys(balances).forEach(p => {
      if (balances[p] < 0) debtors.push({ player: p, amount: Math.abs(balances[p]) });
      if (balances[p] > 0) creditors.push({ player: p, amount: balances[p] });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let settlements = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];
      let amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0) {
        settlements.push({ from: debtor.player, to: creditor.player, amount });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount === 0) i++;
      if (creditor.amount === 0) j++;
    }

    return { balances, settlements };
  };

  const { balances, settlements } = calculateSettlements();

  return (
    <div className="min-h-screen bg-[#1a2c38] text-white font-sans flex flex-col items-center overflow-x-hidden relative">
      
      {/* CSS Animations Globales & Combats */}
      <style>{`
        @keyframes confetti-fall { 0% { transform: translateY(-100vh) rotate(0deg); } 100% { transform: translateY(100vh) rotate(720deg); } }
        .animate-confetti-fall { animation: confetti-fall linear infinite; }
        @keyframes tension-pulse { 0%, 100% { box-shadow: inset 0 0 50px rgba(220,38,38,0); } 50% { box-shadow: inset 0 0 100px rgba(220,38,38,0.15); } }
        .tension-bg { animation: tension-pulse 2s ease-in-out infinite; }
        
        @keyframes fx-slash { 0% { transform: scale(0.5) rotate(-45deg); opacity: 0; } 50% { transform: scale(1.5) rotate(-45deg); opacity: 1; } 100% { transform: scale(2) rotate(-45deg); opacity: 0; } }
        .effect-slash::after { content: ''; position: fixed; top: 40%; left: 0; width: 100%; height: 20px; background: white; z-index: 100; pointer-events: none; animation: fx-slash 0.4s ease-out forwards; box-shadow: 0 0 30px white; }
        @keyframes fx-fire { 0% { box-shadow: inset 0 0 0px rgba(239,68,68,0); } 30% { box-shadow: inset 0 0 200px rgba(239,68,68,0.8); } 100% { box-shadow: inset 0 0 0px rgba(239,68,68,0); } }
        .effect-fire::after { content: ''; position: fixed; inset: 0; z-index: 100; pointer-events: none; animation: fx-fire 0.8s ease-out forwards; }
        @keyframes fx-blood { 0% { border: 0px solid rgba(220,38,38,0); } 20% { border: 20px solid rgba(220,38,38,0.8); } 100% { border: 0px solid rgba(220,38,38,0); } }
        .effect-blood::after { content: ''; position: fixed; inset: 0; z-index: 100; pointer-events: none; animation: fx-blood 0.6s ease-out forwards; }
        @keyframes fx-explosion { 0% { background: rgba(255,255,255,0.8); } 100% { background: transparent; } }
        .effect-explosion::after { content: ''; position: fixed; inset: 0; z-index: 100; pointer-events: none; animation: fx-explosion 0.5s ease-out forwards; }
        
        @keyframes hit-shake {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-10px, 10px) rotate(-4deg); filter: brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(3); }
          50% { transform: translate(10px, -10px) rotate(4deg); }
          75% { transform: translate(-10px, -10px) rotate(-4deg); }
          100% { transform: translate(0, 0) rotate(0deg); filter: none; }
        }
        .animate-hit { animation: hit-shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes lunge-p1 { 0% { transform: translateX(0) scale(1); } 50% { transform: translateX(120px) scale(1.1) rotate(15deg); z-index: 20; } 100% { transform: translateX(0) scale(1); } }
        @keyframes lunge-p2 { 0% { transform: translateX(0) scale(1); } 50% { transform: translateX(-120px) scale(1.1) rotate(-15deg); z-index: 20; } 100% { transform: translateX(0) scale(1); } }
        .animate-lunge-p1 { animation: lunge-p1 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-lunge-p2 { animation: lunge-p2 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {screenEffect && <div className={`fixed inset-0 pointer-events-none z-50 effect-${screenEffect}`}></div>}

      {winner && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(60)].map((_, i) => (
            <div key={i} className="absolute w-3 h-3 rounded-sm animate-confetti-fall"
                 style={{
                   left: `${Math.random() * 100}%`, backgroundColor: ['#eab308', '#22c55e', '#ef4444', '#3b82f6', '#a855f7'][Math.floor(Math.random()*5)],
                   animationDuration: `${Math.random() * 3 + 2}s`, animationDelay: `${Math.random() * 2}s`
                 }} />
          ))}
        </div>
      )}

      {/* Navbar */}
      <header className="w-full h-16 bg-[#1a2c38] border-b border-[#2f4553] flex items-center justify-between px-6 shadow-sm z-30 relative">
        <div className="flex items-center gap-2 text-2xl font-black tracking-tighter">
          <Dices className="text-[#00e701] w-8 h-8" />
          <span className="flex items-baseline">KAMAS<span className="text-[#b1bad3]">.BET</span><span className="ml-2 text-xs text-[#557086] font-medium lowercase italic">by Patrice</span></span>
          <div className="flex items-center gap-2 ml-4">
            <button onClick={resetGlobal} className="text-[10px] bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1 uppercase font-bold" title="Tout réinitialiser">
               <RefreshCw className="w-3 h-3" /> NOUVELLE PARTIE
            </button>
            {(alivePlayers.length !== participants.length || winner) && (
              <button onClick={() => initGame(participants)} className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500 hover:text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1 uppercase font-bold" title="Relancer la roulette du Chaos avec les mêmes options">
                 <Play className="w-3 h-3" /> RELANCER LE COMBAT
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-[#b1bad3] hover:text-white transition-colors p-2">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="bg-[#0f212e] px-4 py-2 rounded-md flex items-center gap-2 font-bold shadow-inner border border-[#2f4553]">
             <span className="text-[#00e701]">{formatKamas(kamaPrize)}</span>
             <Coins className="text-yellow-500 w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 relative z-10">
        
        {/* PANNEAU GAUCHE */}
        <div className="w-full lg:w-80 bg-[#213743] rounded-lg p-4 flex flex-col shrink-0 shadow-lg h-fit border border-[#2f4553] z-20">
          <div className="flex border-b border-[#2f4553] mb-4">
            <button onClick={() => setActiveTab('config')} className={`flex-1 py-2 text-sm font-bold border-b-2 flex justify-center items-center gap-2 transition-colors ${activeTab === 'config' ? 'border-[#00e701] text-[#00e701]' : 'border-transparent text-[#b1bad3] hover:text-white'}`}>
              <Settings className="w-4 h-4" /> Config
            </button>
            <button onClick={() => setActiveTab('ardoise')} className={`flex-1 py-2 text-sm font-bold border-b-2 flex justify-center items-center gap-2 transition-colors ${activeTab === 'ardoise' ? 'border-[#00e701] text-[#00e701]' : 'border-transparent text-[#b1bad3] hover:text-white'}`}>
              <Wallet className="w-4 h-4" /> Ardoise
            </button>
          </div>

          {activeTab === 'config' ? (
            <div className="flex-1 space-y-4 animate-fade-in">
              <div className="flex gap-2">
                <button onClick={() => setGameMode('pvp')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors ${gameMode === 'pvp' ? 'bg-red-600 text-white shadow-md' : 'bg-[#1a2c38] text-[#557086] border border-[#2f4553]'}`}><Swords className="w-3.5 h-3.5"/> Mode PvP</button>
                <button onClick={() => setGameMode('pvm')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors ${gameMode === 'pvm' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-[#1a2c38] text-[#557086] border border-[#2f4553]'}`}><Activity className="w-3.5 h-3.5"/> Boss PvM</button>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1 text-[#b1bad3]">Cagnotte Globale</div>
                <div className="relative bg-[#0f212e] border border-[#2f4553] rounded-md focus-within:border-[#557086] transition-colors">
                  <input type="number" value={kamaPrize} onChange={(e) => setKamaPrize(Number(e.target.value))} className="w-full bg-transparent py-2 pl-3 pr-10 text-white font-bold outline-none" />
                  <Coins className="absolute right-3 top-2.5 w-4 h-4 text-yellow-500" />
                </div>
              </div>

              {/* OUTIL D'ABONDEMENT DES PARTICIPANTS */}
              <div className="bg-[#0f212e] border border-[#2f4553] p-3 rounded-md">
                <div className="flex justify-between items-center text-xs font-semibold text-[#b1bad3] mb-2 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><PlusCircle className="w-3 h-3"/> Ajouter une Mise</span>
                </div>
                <select 
                  value={selectedContributor} 
                  onChange={(e) => setSelectedContributor(e.target.value)}
                  className="w-full bg-[#1a2c38] border border-[#2f4553] rounded py-2 px-2 text-sm text-white mb-2 outline-none focus:border-[#00e701] transition-colors"
                >
                  {alivePlayers.length === 0 && <option value="">Aucun joueur...</option>}
                  {alivePlayers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="flex gap-1">
                  <button onClick={() => handleAddContribution(1000000)} disabled={!selectedContributor} className="flex-1 text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 py-1.5 rounded hover:bg-green-500/20 transition-colors disabled:opacity-30">+1M</button>
                  <button onClick={() => handleAddContribution(5000000)} disabled={!selectedContributor} className="flex-1 text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 py-1.5 rounded hover:bg-green-500/20 transition-colors disabled:opacity-30">+5M</button>
                  <button onClick={() => handleAddContribution(10000000)} disabled={!selectedContributor} className="flex-1 text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 py-1.5 rounded hover:bg-green-500/20 transition-colors disabled:opacity-30">+10M</button>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center text-sm font-semibold mb-1">
                  <span className="text-[#b1bad3] flex items-center gap-1"><AlignLeft className="w-4 h-4"/> Inscrits</span>
                  <span className="bg-[#2f4553] text-[#b1bad3] text-xs py-0.5 px-2 rounded-sm">{participants.length}</span>
                </div>
                <textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} onBlur={handleUpdateParticipants} disabled={alivePlayers.length !== participants.length && !winner} placeholder="Un pseudo par ligne..." className="w-full h-20 bg-[#0f212e] border border-[#2f4553] rounded-md py-2 px-3 text-sm text-[#b1bad3] focus:ring-0 focus:border-[#557086] outline-none resize-none disabled:opacity-50"></textarea>
              </div>

              <div className="flex justify-between items-center bg-[#0f212e] p-2 rounded-md border border-[#2f4553]">
                <span className="text-xs font-semibold text-[#b1bad3] flex items-center gap-1"><Percent className="w-3 h-3"/> Afficher les Cotes</span>
                <label className="flex items-center cursor-pointer">
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${showOdds ? 'bg-[#00e701]' : 'bg-[#2f4553]'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showOdds ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={showOdds} onChange={(e) => setShowOdds(e.target.checked)} />
                </label>
              </div>
              
              <div className="flex flex-col gap-2 bg-[#0f212e] p-3 rounded-md border border-[#2f4553]">
                <span className="text-[#b1bad3] text-sm font-semibold flex items-center gap-1 mb-1"><Zap className="w-4 h-4"/> Événements Actifs & Poids</span>
                <div className="grid grid-cols-1 gap-y-3">
                  {[
                    { key: 'shield', icon: <Shield className="w-3 h-3"/>, label: 'Bouclier Feca', color: 'text-blue-400' },
                    { key: 'resurrect', icon: <ArrowUpCircle className="w-3 h-3"/>, label: 'Laisse Spirituelle', color: 'text-emerald-400' },
                    { key: 'carnage', icon: <Skull className="w-3 h-3"/>, label: 'Colère de Iop', color: 'text-red-500' },
                    { key: 'assassin', icon: <Sword className="w-3 h-3"/>, label: 'Attaque Mortelle', color: 'text-purple-400' },
                    { key: 'thief', icon: <Footprints className="w-3 h-3"/>, label: 'Arnaque', color: 'text-orange-400' },
                    { key: 'duel', icon: <Swords className="w-3 h-3"/>, label: 'Duel de Iop', color: 'text-gray-300' },
                    { key: 'potato', icon: <Bomb className="w-3 h-3"/>, label: 'Bombe Ambulante', color: 'text-red-400' },
                    { key: 'pact', icon: <Droplets className="w-3 h-3"/>, label: 'Pacte Sang', color: 'text-rose-400' }
                  ].map(ev => (
                    <div key={ev.key} className="flex items-center justify-between group relative">
                      <span className={`text-[12px] font-medium ${ev.color} flex items-center gap-1.5 cursor-help w-28`}>
                        <span className="w-3">{ev.icon}</span> <span className="truncate">{ev.label}</span>
                      </span>
                      
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-[#0a151d] border border-[#2f4553] p-2 rounded text-[10px] text-gray-300 z-50 shadow-xl pointer-events-none">
                        <strong className={ev.color}>{ev.label}</strong><br/>{EVENT_DESCRIPTIONS[ev.key]}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          min="1" 
                          max="99" 
                          value={eventWeights[ev.key]} 
                          onChange={(e) => setEventWeights(prev => ({...prev, [ev.key]: Number(e.target.value)}))} 
                          disabled={!activeEvents[ev.key] || isSpinning}
                          title="Poids (Probabilité relative)"
                          className="w-12 bg-[#1a2c38] border border-[#2f4553] text-white text-[11px] rounded py-0.5 px-1 outline-none text-center focus:border-[#00e701] disabled:opacity-50" 
                        />
                        <label className="flex items-center cursor-pointer">
                          <div className={`w-7 h-4 rounded-full relative transition-colors shrink-0 ${activeEvents[ev.key] ? 'bg-[#00e701]' : 'bg-[#2f4553]'}`}>
                            <div className={`absolute top-[2px] left-[2px] w-3 h-3 rounded-full bg-white transition-transform ${activeEvents[ev.key] ? 'translate-x-3' : 'translate-x-0'}`}></div>
                          </div>
                          <input type="checkbox" className="hidden" checked={activeEvents[ev.key]} onChange={(e) => setActiveEvents(prev => ({...prev, [ev.key]: e.target.checked}))} disabled={isSpinning} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-3 animate-fade-in pr-2 overflow-hidden h-full">
              
              {/* TABS DE L'ARDOISE */}
              <div className="flex gap-2">
                <button onClick={() => setArdoiseView('history')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${ardoiseView !== 'bilan' ? 'bg-blue-600 text-white shadow-md' : 'bg-[#0f212e] text-[#b1bad3] border border-[#2f4553] hover:bg-[#1a2c38]'}`}>
                  <History className="w-3.5 h-3.5" /> Mouvements
                </button>
                <button onClick={() => setArdoiseView('bilan')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${ardoiseView === 'bilan' ? 'bg-[#00e701] text-[#0f212e] shadow-[0_0_15px_rgba(0,231,1,0.3)]' : 'bg-[#0f212e] text-[#b1bad3] border border-[#2f4553] hover:bg-[#1a2c38]'}`}>
                  <Wallet className="w-3.5 h-3.5" /> Règlements
                </button>
              </div>

              {/* CONTENU SECONDAIRE SI HISTORY */}
              {ardoiseView !== 'bilan' && (
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setArdoiseView('mises')} className={`flex-1 py-1.5 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors ${ardoiseView === 'history' || ardoiseView === 'mises' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-[#1a2c38] text-[#557086] hover:text-[#b1bad3]'}`}>Historique: Mises</button>
                  <button onClick={() => setArdoiseView('gains')} className={`flex-1 py-1.5 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors ${ardoiseView === 'gains' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-[#1a2c38] text-[#557086] hover:text-[#b1bad3]'}`}>Historique: Gains</button>
                </div>
              )}

              {/* LISTE DES TRANSACTIONS */}
              <div className="flex justify-end mb-1 px-1">
                 {ardoiseView === 'bilan' && (
                   <button onClick={exportBilanImage} className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1.5 rounded shadow transition-all"><Download className="w-3 h-3"/> Exporter en image</button>
                 )}
              </div>
              <div ref={ardoiseRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pb-2 p-1 bg-[#213743]">
                {ardoiseView === 'bilan' ? (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="bg-[#1a2c38] p-3 rounded-md border border-[#2f4553]">
                      <h4 className="text-xs font-black text-[#b1bad3] mb-3 uppercase tracking-widest text-center">Transferts Recommandés</h4>
                      {settlements.length === 0 ? (
                        <div className="text-center text-[#557086] text-xs py-4">Tout le monde est à l'équilibre !</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {settlements.map((s, idx) => (
                            <div key={`settle-${idx}`} className="flex items-center justify-between bg-[#0a151d] p-2 rounded border border-[#2f4553]">
                              <span className="text-red-400 font-bold text-[11px] truncate w-1/3 text-left">{s.from}</span>
                              <div className="text-[#b1bad3] text-[10px] flex flex-col items-center mx-1 shrink-0">
                                <span className="font-black text-[#00e701]">{formatKamas(s.amount)}</span>
                                <span className="text-[10px] leading-none text-[#557086]">➔</span>
                              </div>
                              <span className="text-green-400 font-bold text-[11px] truncate text-right w-1/3">{s.to}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#557086] mb-2 uppercase tracking-wide">Balance Nette Individuelle</h4>
                      <div className="flex flex-col gap-1.5">
                        {Object.entries(balances).sort((a,b) => b[1] - a[1]).map(([p, bal]) => {
                          if (bal === 0) return null;
                          return (
                            <div key={p} className={`flex justify-between p-2 mt-1 rounded text-xs border ${bal > 0 ? 'bg-green-900/10 border-green-500/20 text-green-400' : 'bg-red-900/10 border-red-500/20 text-red-400'}`}>
                              <span className="font-semibold truncate">{p}</span>
                              <span className="font-black">{bal > 0 ? '+' : ''}{formatKamas(bal)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : ardoiseView !== 'gains' ? (
                  contributions.length === 0 ? (
                    <div className="text-center text-[#557086] text-xs py-8">Aucune mise enregistrée.</div>
                  ) : (
                    contributions.map(contrib => (
                      <div key={contrib.id} className="border p-2.5 rounded-md flex flex-col gap-1 transition-colors bg-[#0f212e] border-[#2f4553]">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#b1bad3] mb-0.5">{contrib.date}</span>
                            <div className="font-bold truncate text-sm text-blue-400">{contrib.player}</div>
                            <div className="text-xs font-black mt-1 text-blue-500">+ {formatKamas(contrib.amount)} K</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  sessionHistory.length === 0 ? (
                    <div className="text-center text-[#557086] text-xs py-8">Aucun gain ni vol enregistré.</div>
                  ) : (
                    sessionHistory.map(hist => (
                      <div key={hist.id} className="border p-2.5 rounded-md flex flex-col gap-1 transition-colors bg-[#0f212e] border-[#2f4553]">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#b1bad3] mb-0.5 flex items-center gap-1">
                              {hist.date}
                              {hist.type === 'thief' ? <Footprints className="w-3 h-3 text-orange-500" /> : <Trophy className="w-3 h-3 text-yellow-500" />}
                            </span>
                            <div className={`font-bold truncate text-sm ${hist.type === 'thief' ? 'text-orange-400' : 'text-yellow-400'}`}>
                              {hist.winner} {hist.type === 'thief' && <span className="text-[10px] uppercase text-orange-500/70 ml-1">(Voleur)</span>}
                            </div>
                            <div className={`text-xs font-black mt-1 ${hist.type === 'thief' ? 'text-orange-500' : 'text-yellow-500'}`}>
                              - {formatKamas(hist.prize)} K
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* ZONE DE JEU PRINCIPALE */}
        <div className={`flex-1 bg-[#0f212e] rounded-lg relative flex flex-col shadow-inner border border-[#213743] overflow-hidden transition-colors duration-1000 ${isTension ? 'tension-bg' : ''}`}>
          
          <div className="absolute top-6 left-6 text-[#b1bad3] font-bold text-lg flex items-center gap-2 opacity-50 pointer-events-none z-10">
            <Crosshair className="w-5 h-5" /> {isTension ? <span className="text-red-500 animate-pulse">TENSION MAXIMALE</span> : "ROULETTE DU CHAOS"}
          </div>

          {/* OVERLAY: ASSASSIN */}
          {assassinTargeting && (
            <div className="absolute inset-0 bg-[#0a151d]/95 z-40 flex flex-col items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
              <Sword className="w-16 h-16 text-purple-500 mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-white text-center uppercase tracking-wide mb-2">Attaque Mortelle</h2>
              <p className="text-purple-300 text-lg text-center mb-8 bg-purple-900/30 px-6 py-2 rounded-full border border-purple-500/50">
                <strong className="text-white">{assassinTargeting}</strong>, choisissez votre victime :
              </p>
              <div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto p-2 scrollbar-thin">
                {alivePlayers.filter(p => p !== assassinTargeting).map(target => (
                  <button key={target} onClick={() => handleAssassinKill(target)} className="bg-[#213743] hover:bg-red-600 border border-[#2f4553] hover:border-red-500 text-white px-4 py-3 rounded-md font-bold transition-all hover:scale-105 shadow-md flex items-center justify-between group">
                    <span className="truncate">{target}</span> <Crosshair className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* OVERLAY: PACT CHOOSER */}
          {pactChooser && (
            <div className="absolute inset-0 bg-[#0a151d]/95 z-50 flex flex-col items-center justify-center p-6 animate-fade-in backdrop-blur-md">
              <Droplets className="w-20 h-20 text-rose-500 mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]" />
              <h2 className="text-4xl font-black text-rose-500 text-center uppercase tracking-widest mb-2 drop-shadow-md">Pacte de Sang</h2>
              <p className="text-rose-200 text-lg text-center mb-8 bg-rose-900/30 px-6 py-2 rounded-full border border-rose-500/50">
                <strong className="text-white">{pactChooser}</strong>, liez 2 joueurs par le sang :
              </p>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl max-h-[40vh] overflow-y-auto p-2">
                {alivePlayers.map(target => (
                  <button 
                    key={target} 
                    onClick={() => {
                      setPactSelection(prev => 
                        prev.includes(target) ? prev.filter(p => p !== target) : 
                        prev.length < 2 ? [...prev, target] : prev
                      );
                    }}
                    className={`px-6 py-3 rounded-full text-base font-bold border transition-all hover:scale-105 shadow-md flex items-center justify-center min-w-[120px] ${pactSelection.includes(target) ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.8)]' : 'bg-[#213743] hover:bg-[#2f4553] border-[#2f4553] hover:border-gray-400 text-[#b1bad3] hover:text-white'}`}
                  >
                    {target}
                  </button>
                ))}
              </div>
              <div className="mt-8 h-16 flex items-center">
                {pactSelection.length === 2 && (
                  <button 
                    onClick={() => {
                       setBloodPact(pactSelection);
                       setLastEvent({ type: 'pact', message: `🩸 ${pactChooser} a lié ${pactSelection[0]} et ${pactSelection[1]} par le Sang !` });
                       triggerScreenEffect('blood'); playSound('divine', soundEnabled);
                       setPactChooser(null);
                       checkWinCondition(alivePlayers, kamaPrize);
                    }}
                    className="px-12 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-black text-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(225,29,72,0.6)] animate-fade-in-up"
                  >
                    Sceller le Pacte
                  </button>
                )}
              </div>
            </div>
          )}

          {/* OVERLAY: DUEL 1V1 (COMBAT ANIMÉ) */}
          {duelState && (
            <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 animate-fade-in backdrop-blur-md transition-all duration-1000 ${duelState.phase === 'suspense' ? 'bg-red-950/95' : 'bg-[#0a151d]/95'}`}>
              <h2 className={`text-5xl font-black uppercase tracking-widest mb-12 transition-colors duration-500 ${duelState.phase === 'suspense' ? 'text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.8)] animate-pulse' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}>
                {duelState.phase === 'suspense' ? 'COUP FATAL...' : 'Combat à Mort'}
              </h2>

              {duelState.phase === 'countdown' && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                  <span className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-ping">{duelState.countdownText}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-12 w-full max-w-4xl relative">
                
                {/* JOUEUR 1 */}
                <div className={`flex-1 flex flex-col items-center transition-all duration-500 ${duelState.phase === 'suspense' && duelState.attacker === 'p2' ? 'scale-95 grayscale brightness-50' : ''}`}>
                  {(duelState.phase === 'fighting' || duelState.phase === 'suspense' || duelState.phase === 'dead') && (
                    <div className="w-full h-6 bg-gray-900 rounded-full overflow-hidden mb-6 border-2 border-gray-700 shadow-lg">
                      <div className={`h-full transition-all duration-300 ${duelState.p1Hp > 50 ? 'bg-green-500' : duelState.p1Hp > 20 ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${duelState.p1Hp}%` }}></div>
                    </div>
                  )}

                  <div className="relative mb-6">
                    <div className={`transition-all duration-200
                      ${duelState.attacker === 'p1' ? 'animate-lunge-p1' : ''}
                      ${duelState.hitTarget === 'p1' ? 'animate-hit opacity-70 grayscale' : ''}
                      ${duelState.phase === 'dead' && duelState.p1Hp === 0 ? 'opacity-20 grayscale rotate-90 translate-y-10' : ''}
                    `}>
                      <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center bg-[#1a2c38] shadow-2xl z-10 relative
                        ${duelState.attacker === 'p1' ? 'border-[#00e701] shadow-[0_0_30px_rgba(0,231,1,0.5)]' : 'border-[#2f4553]'}
                      `}>
                        {duelState.phase === 'dead' && duelState.p1Hp === 0 ? <Skull className="w-16 h-16 text-red-500" /> : <User className="w-16 h-16 text-white" />}
                      </div>
                      {duelState.phase !== 'dead' && (
                        <div className={`absolute top-4 -right-12 transition-transform duration-200 origin-bottom-left
                          ${duelState.attacker === 'p1' ? 'rotate-[60deg] translate-x-4 translate-y-4' : 'rotate-12'}
                        `}>
                          <Sword className="w-16 h-16 text-gray-300 drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white break-all text-center">{duelState.p1}</div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center z-10 px-4">
                  <Swords className={`w-20 h-20 text-gray-400 ${(duelState.phase === 'fighting' || duelState.phase === 'countdown') ? 'animate-spin text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''}`} />
                </div>

                {/* JOUEUR 2 */}
                <div className={`flex-1 flex flex-col items-center transition-all duration-500 ${duelState.phase === 'suspense' && duelState.attacker === 'p1' ? 'scale-95 grayscale brightness-50' : ''}`}>
                  {(duelState.phase === 'fighting' || duelState.phase === 'suspense' || duelState.phase === 'dead') && (
                    <div className="w-full h-6 bg-gray-900 rounded-full overflow-hidden mb-6 border-2 border-gray-700 shadow-lg flex justify-end">
                      <div className={`h-full transition-all duration-300 ${duelState.p2Hp > 50 ? 'bg-green-500' : duelState.p2Hp > 20 ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${duelState.p2Hp}%` }}></div>
                    </div>
                  )}

                  <div className="relative mb-6">
                    <div className={`transition-all duration-200
                      ${duelState.attacker === 'p2' ? 'animate-lunge-p2' : ''}
                      ${duelState.hitTarget === 'p2' ? 'animate-hit opacity-70 grayscale' : ''}
                      ${duelState.phase === 'dead' && duelState.p2Hp === 0 ? 'opacity-20 grayscale -rotate-90 translate-y-10' : ''}
                    `}>
                      <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center bg-[#1a2c38] shadow-2xl z-10 relative
                        ${duelState.attacker === 'p2' ? 'border-[#00e701] shadow-[0_0_30px_rgba(0,231,1,0.5)]' : 'border-[#2f4553]'}
                      `}>
                        {duelState.phase === 'dead' && duelState.p2Hp === 0 ? <Skull className="w-16 h-16 text-red-500" /> : <User className="w-16 h-16 text-white" />}
                      </div>
                      {duelState.phase !== 'dead' && (
                        <div className={`absolute top-4 -left-12 transition-transform duration-200 origin-bottom-right
                          ${duelState.attacker === 'p2' ? '-rotate-[60deg] -translate-x-4 translate-y-4' : '-rotate-12'}
                        `}>
                          <Sword className="w-16 h-16 text-gray-300 drop-shadow-md transform -scale-x-100" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white break-all text-center">{duelState.p2}</div>
                </div>

              </div>

              {!duelState.resolving && (
                <button onClick={resolveDuel} className="mt-20 px-12 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-2xl uppercase tracking-wider rounded-lg shadow-[0_0_40px_rgba(239,68,68,0.6)] transition-all hover:scale-105">
                  Lancer le Combat
                </button>
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col">
            
            {/* LA ROULETTE */}
            <div className="w-full bg-[#1a2c38] border-b border-[#2f4553] pt-20 pb-8 relative flex flex-col items-center">
              
              {!winner ? (
                <>
                  {gameMode === 'pvm' && (
                    <div className="absolute top-4 inset-x-0 mx-auto w-3/4 max-w-lg z-20 flex flex-col items-center animate-fade-in-up">
                      <div className="text-purple-400 font-black text-xl mb-1 uppercase tracking-widest drop-shadow-[0_0_10px_purple]">LE BOSS</div>
                      <div className="w-full h-8 bg-gray-900 rounded-full border-2 border-gray-700 shadow-[0_0_20px_rgba(168,85,247,0.3)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-500" style={{ width: `${Math.max(0, (bossHp/maxBossHp)*100)}%` }}></div>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm mix-blend-difference">{bossHp} / {maxBossHp} PV</div>
                      </div>
                    </div>
                  )}

                  <div className="relative w-full max-w-4xl h-32 overflow-hidden border-y border-[#2f4553]/60 bg-[#0a151d] shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] mt-4">
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#1a2c38] to-transparent z-40 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#1a2c38] to-transparent z-40 pointer-events-none"></div>
                    
                    {/* Ligne Laser Subtile */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-[2px] z-30 -translate-x-1/2 bg-gradient-to-b from-yellow-400/70 via-transparent to-emerald-400/70 mix-blend-screen pointer-events-none shadow-[0_0_15px_rgba(250,204,21,0.3)]"></div>
                    
                    {/* Curseur Haut (Kamas Doré) */}
                    <div className="absolute top-[-8px] left-1/2 z-40 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)] pointer-events-none">
                      <div className="w-5 h-5 bg-[#1a2c38] border-[3px] border-yellow-400 rotate-45 flex items-center justify-center shadow-inner">
                         <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Curseur Bas (Dofus Emeraude) */}
                    <div className="absolute bottom-[-8px] left-1/2 z-40 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(52,211,153,0.9)] pointer-events-none">
                      <div className="w-5 h-5 bg-[#1a2c38] border-[3px] border-emerald-400 rotate-45 flex items-center justify-center shadow-inner">
                         <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    <div className="absolute left-1/2 h-full flex gap-4 items-center w-max z-10" style={spinStyles}>
                      {wheelItems.map((item, index) => (
                        <div key={index} className={getWheelItemClass(item, lastEvent !== null && index === 50)}>
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-12 mt-4 flex items-center justify-center">
                    {lastEvent && (
                      <div className={`px-6 py-2 rounded-full font-bold uppercase tracking-wide animate-fade-in-up border text-sm ${
                        lastEvent.type === 'kill' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                        lastEvent.type === 'shield_break' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        lastEvent.type === 'carnage' ? 'bg-red-900/50 text-red-400 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' :
                        lastEvent.type === 'assassin' ? 'bg-purple-900/50 text-purple-400 border-purple-500' :
                        lastEvent.type === 'thief' ? 'bg-orange-900/50 text-orange-400 border-orange-500' :
                        lastEvent.type === 'potato' ? 'bg-red-900/80 text-white border-red-500' :
                        lastEvent.type === 'pact' ? 'bg-rose-900/50 text-rose-300 border-rose-500' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {lastEvent.message}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <button 
                      onClick={spinForElimination}
                      disabled={isSpinning || alivePlayers.length < 2 || assassinTargeting || duelState}
                      className={`px-12 py-4 rounded-md font-bold text-xl uppercase tracking-wide transition-all flex items-center gap-3 ${
                        isSpinning || alivePlayers.length < 2 || assassinTargeting || duelState
                          ? 'bg-[#2f4553] text-[#b1bad3] cursor-not-allowed' 
                          : 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                      }`}
                    >
                      {isSpinning ? 'La roue tourne...' : potatoHolder ? <><Bomb className="w-6 h-6 animate-pulse"/> Évaluer la bombe</> : <><Crosshair className="w-6 h-6" /> Tirer au sort</>}
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 px-12 flex flex-col items-center animate-fade-in z-20 relative">
                  <div className="text-[#00e701] font-bold text-xl mb-4 uppercase tracking-widest flex items-center gap-3">
                    <Trophy className="w-8 h-8" /> Grand Gagnant
                  </div>
                  <div className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-[0_0_20px_rgba(0,231,1,0.4)] text-center">
                    {winner}
                  </div>
                  <div className="bg-[#0f212e] border border-[#00e701]/30 px-8 py-4 rounded-lg flex items-center gap-3 shadow-[0_0_30px_rgba(0,231,1,0.15)]">
                    <span className="text-[#b1bad3] text-lg uppercase tracking-wide">Remporte :</span>
                    <span className="text-[#00e701] font-black text-3xl">{formatKamas(kamaPrize)} <Coins className="inline w-8 h-8 text-yellow-500 -mt-2" /></span>
                  </div>
                </div>
              )}
            </div>

            {/* ZONES DE LISTES (Bas) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              
              {/* SURVIVANTS */}
              <div className="bg-[#1a2c38] rounded-md border border-[#2f4553] flex flex-col overflow-hidden shadow-md">
                <div className="bg-[#213743] p-3 text-sm font-bold text-[#b1bad3] flex items-center justify-between border-b border-[#2f4553]">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4"/> Survivants</span>
                  <span className="bg-[#0f212e] px-2 py-0.5 rounded text-[#00e701]">{alivePlayers.length}</span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-2 content-start scrollbar-thin">
                  {alivePlayers.map((player, idx) => (
                    <div key={`alive-${idx}`} className={`px-3 py-2 rounded-md text-sm font-medium border flex items-center transition-colors ${
                      winner && winner.includes(player) ? 'bg-[#00e701] text-[#0f212e] border-[#00e701] scale-105 transform origin-left shadow-lg' : 
                      potatoHolder === player ? 'bg-red-900/40 text-red-200 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' :
                      shieldedPlayers.includes(player) ? 'bg-blue-900/30 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 
                      isTension ? 'bg-red-900/20 text-red-200 border-red-500/30' :
                      'bg-[#2f4553] text-white border-[#3d5668]'
                    }`}>
                      <span className="truncate">{player}</span>
                      <div className="ml-auto flex items-center gap-2">
                        {bloodPact && bloodPact.includes(player) && <Droplets className="w-4 h-4 text-rose-500 drop-shadow-md" title="Lié par un Pacte de Sang" />}
                        {shieldedPlayers.includes(player) && <Shield className="w-4 h-4 text-blue-400" title="Protégé par un bouclier" />}
                        {potatoHolder === player && <Bomb className="w-4 h-4 text-red-400 animate-bounce" title="A la patate chaude !" />}
                        {showOdds && !winner && <span className="text-[10px] text-[#00e701] font-black border border-[#00e701]/30 bg-[#00e701]/10 px-1.5 py-0.5 rounded ml-1" title="Cote de base (approximative)">{(100 / alivePlayers.length).toFixed(1)}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ELIMINES */}
              <div className="bg-[#1a2c38] rounded-md border border-[#2f4553] flex flex-col overflow-hidden shadow-md">
                <div className="bg-[#213743] p-3 text-sm font-bold text-[#b1bad3] flex items-center justify-between border-b border-[#2f4553]">
                  <span className="flex items-center gap-2"><Skull className="w-4 h-4"/> Éliminés</span>
                  <span className="bg-[#0f212e] px-2 py-0.5 rounded text-red-500">{eliminatedPlayers.length}</span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-2 scrollbar-thin">
                  {eliminatedPlayers.map((player, idx) => {
                    const isThief = lastEvent?.type === 'thief' && lastEvent.message.includes(player);
                    const isRecentDeath = lastEvent && (lastEvent.type === 'kill' || lastEvent.type === 'carnage') && lastEvent.message.includes(player);
                    return (
                      <div key={`dead-${idx}`} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium border ${
                        isRecentDeath ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                        : isThief ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                        : 'bg-[#0f212e] border-transparent text-[#557086]'
                      }`}>
                        {isThief ? <Footprints className="w-4 h-4 text-orange-500" /> : <Skull className={`w-4 h-4 ${isRecentDeath ? 'text-red-500' : 'text-[#3d5668]'}`} />}
                        <span className="line-through">{player}</span>
                        {isThief && <span className="ml-auto text-xs font-bold uppercase tracking-wider text-orange-500/70">-33% volé</span>}
                        {isRecentDeath && <span className="ml-auto text-xs font-bold uppercase tracking-wider text-red-500/70">RIP</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;