import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

// Simple in-memory cache
interface CacheEntry {
  data: any;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private ttlSeconds: number;

  constructor(ttlSeconds: number = 300) {
    this.ttlSeconds = ttlSeconds;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = `${request.url}`;
    const cached = cache.get(cacheKey);
    
    // Return cached data if valid
    if (cached && cached.expiry > Date.now()) {
      response.set('X-Cache', 'HIT');
      response.set('Cache-Control', `public, max-age=${this.ttlSeconds}`);
      return of(cached.data);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap((data) => {
        cache.set(cacheKey, {
          data,
          expiry: Date.now() + this.ttlSeconds * 1000,
        });
        response.set('X-Cache', 'MISS');
        response.set('Cache-Control', `public, max-age=${this.ttlSeconds}`);
      }),
    );
  }
}

// Cache invalidation helper
export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (typeof pattern === 'string') {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    } else {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    }
  }
}

// Decorator factory for custom TTL
export function Cached(ttlSeconds: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `method:${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
      
      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, {
        data: result,
        expiry: Date.now() + ttlSeconds * 1000,
      });
      
      return result;
    };
    
    return descriptor;
  };
}
