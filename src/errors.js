class TeamcityError extends Error {
  constructor (message) {
    super(message);
    this.name = 'TeamcityError';
  }
}

module.exports = {
  teamcity: TeamcityError
};
