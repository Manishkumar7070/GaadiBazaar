# Security Specification

## Data Invariants
1. A vehicle must have a valid seller ID matching the authenticated user.
2. A shop must have a valid owner ID matching the authenticated user.
3. Verification status can only be set to 'pending' by users; only admins can change it to 'verified' or 'rejected'.
4. Vehicle status must be one of: 'active', 'sold', 'pending', 'inactive'.
5. Timestamps like `createdAt` must be immutable and set by the server.

## The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Create a vehicle with `sellerId` of another user.
2. **Privilege Escalation**: Update a vehicle's `verificationStatus` directly from 'pending' to 'verified'.
3. **Ghost Fields**: Add an `isVerified` field to a shop document.
4. **Invalid Enumeration**: Set `status` to 'stolen'.
5. **Denial of Wallet**: Use an 1MB string as a `shopId`.
6. **Orphaned Record**: Create a wishlist item for a non-existent `vehicleId`.
7. **Bypassing Invariants**: Update `sellerId` on an existing vehicle listing.
8. **Malicious Ownership**: Take ownership of a shop by updating the `ownerId` field.
9. **Timestamp Tampering**: Set a future `createdAt` date.
10. **Admin Spoofing**: Try to update user profile to set `role: 'admin'`.
11. **PII Leak**: A user trying to read another user's private profile.
12. **State Shortcutting**: Skipping 'pending' and setting `verificationStatus` to 'verified' on creation.

## The Test Runner
(This is a conceptual test runner for these rules)
```typescript
// firestore.rules.test.ts
// ... tests for all the above payloads ...
```
