import { Repo, Commit, Finding } from '../types';
import { getMockRepos, getMockCommits, getMockFindings } from './mock-data';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchRepos(_token: string | null): Promise<Repo[]> {
  await delay(600);
  return getMockRepos();
}

export async function fetchCommits(
  _token: string | null,
  repoFullName: string,
  count?: number,
): Promise<Commit[]> {
  await delay(500);
  return getMockCommits(repoFullName, count);
}

export async function fetchFindings(
  _token: string | null,
  shortSha: string,
): Promise<Finding[]> {
  await delay(700);
  return getMockFindings(shortSha);
}
