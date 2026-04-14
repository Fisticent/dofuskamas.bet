export const EVENT_TYPES = {
  ELIMINATION: 'elimination',
  JACKPOT: 'jackpot',
  SHIELD: 'shield',
  RESURRECT: 'resurrect',
  CARNAGE: 'carnage',
  ASSASSIN: 'assassin',
  THIEF: 'thief',
  DUEL: 'duel',
  POTATO: 'potato',
  PACT: 'pact',
  POTATO_EXPLODE: 'potato_explode',
  // Nouveaux événements spéciaux (VFX purs)
  MAGIC_WIPE: 'magic_wipe', 
  // Modes PvM
  PVM_BOSS_ATTACK: 'pvm_boss_attack',
  PVM_PLAYER_ATTACK: 'pvm_player_attack',
  PVM_HEAL_GROUP: 'pvm_heal_group'
};

export const EVENT_DESCRIPTIONS = {
  jackpot: "Ajoute +20% à la cagnotte globale.",
  shield: "Protège un joueur de sa prochaine élimination.",
  resurrect: "Ramène un joueur mort au hasard à la vie.",
  carnage: "Élimine deux joueurs d'un seul coup !",
  assassin: "Le joueur ciblé choisit lui-même qui éliminer.",
  thief: "Un joueur s'enfuit avec 33% de la cagnotte (éliminé).",
  duel: "Un affrontement mortel en 1v1. Le perdant est éliminé.",
  potato: "Une bombe circule ! 50% de chance d'exploser à chaque tour.",
  pact: "Lie 2 joueurs : si l'un meurt, l'autre aussi. S'ils gagnent, gain x2 !",
  pvm_boss_attack: "Le Boss frappe fort ! Un joueur est éliminé.",
  pvm_player_attack: "Le groupe attaque : le Boss perd des points de vie !",
  pvm_heal_group: "Soin de zone ! Ramène un joueur KO avec un bouclier."
};
