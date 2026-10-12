const pendingRequests = new WeakMap();
const pendingTeamRequests = new WeakMap();

function getCachedMembers(memberStore, teamId) {
  return memberStore?.getTeamMember?.(teamId) || [];
}

function hasCompleteCache(members, team) {
  const memberCount = Number(team?.memberCount);
  if (Number.isFinite(memberCount) && memberCount >= 0) {
    return members.length >= memberCount;
  }
  return members.length > 0;
}

export function ensureTeam(store, teamId) {
  const teamStore = store?.teamStore;
  if (!teamId || !teamStore) {
    return Promise.resolve(null);
  }

  const cachedTeam = teamStore.teams?.get(teamId);
  if (cachedTeam) {
    return Promise.resolve(cachedTeam);
  }
  if (typeof teamStore.getTeamActive !== "function") {
    return Promise.resolve(null);
  }

  let storeRequests = pendingTeamRequests.get(teamStore);
  if (!storeRequests) {
    storeRequests = new Map();
    pendingTeamRequests.set(teamStore, storeRequests);
  }
  const pendingRequest = storeRequests.get(teamId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = Promise.resolve()
    .then(() => teamStore.getTeamActive(teamId, 1))
    .finally(() => {
      if (storeRequests.get(teamId) === request) {
        storeRequests.delete(teamId);
      }
    });

  storeRequests.set(teamId, request);
  return request;
}

export function ensureTeamMembers(store, teamId, team) {
  const memberStore = store?.teamMemberStore;
  if (!teamId || !memberStore) {
    return Promise.resolve([]);
  }

  const cachedMembers = getCachedMembers(memberStore, teamId);
  if (team && hasCompleteCache(cachedMembers, team)) {
    return Promise.resolve(cachedMembers);
  }
  if (typeof memberStore.getTeamMemberActive !== "function") {
    return Promise.resolve(cachedMembers);
  }

  let storeRequests = pendingRequests.get(memberStore);
  if (!storeRequests) {
    storeRequests = new Map();
    pendingRequests.set(memberStore, storeRequests);
  }
  const pendingRequest = storeRequests.get(teamId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = Promise.resolve()
    .then(() => team || ensureTeam(store, teamId))
    .then((resolvedTeam) => {
      const currentMembers = getCachedMembers(memberStore, teamId);
      if (hasCompleteCache(currentMembers, resolvedTeam)) {
        return { memberList: currentMembers };
      }
      return memberStore.getTeamMemberActive({
        teamId,
        queryOption: {
          limit: Math.max(Number(resolvedTeam?.memberLimit) || 0, 200),
          roleQueryType: 0,
        },
      });
    })
    .then(
      (result) => result?.memberList || getCachedMembers(memberStore, teamId)
    )
    .finally(() => {
      if (storeRequests.get(teamId) === request) {
        storeRequests.delete(teamId);
      }
    });

  storeRequests.set(teamId, request);
  return request;
}
