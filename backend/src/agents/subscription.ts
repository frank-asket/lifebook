import { Subscription } from '../types';
import { SubscriptionRepository } from '../repositories';

export async function getSubscription(deviceId: string): Promise<Subscription> {
  return SubscriptionRepository.get(deviceId);
}

export async function upgrade(deviceId: string, billingCycle: 'monthly' | 'annual'): Promise<Subscription> {
  const sub: Subscription = {
    deviceId,
    tier: 'premium',
    billingCycle,
    updatedAt: new Date().toISOString(),
  };
  return SubscriptionRepository.upsert(sub);
}
