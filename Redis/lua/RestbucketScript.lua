local AuthToken = redis.call("HMGET", KEYS[1], "currentCapacity", "lastReset")

local capacity     = tonumber(ARGV[1])
local window_size  = tonumber(ARGV[2])
local date_now     = tonumber(ARGV[3])
local Exp_factor   = tonumber(ARGV[4])

if AuthToken[1] == nil then
  AuthToken[1] = capacity
  AuthToken[2] = date_now
end

local delta = math.max(date_now - tonumber(AuthToken[2]), 0)
local inc_by = delta / (window_size / capacity)

local new_capacity = math.min(capacity, tonumber(AuthToken[1]) + inc_by)

if new_capacity < 1 then
  return 0
end

redis.call(
  "HSET",
  KEYS[1],
  "currentCapacity", new_capacity - 1,
  "lastReset", date_now
)

redis.call("EXPIRE", KEYS[1], (window_size / 1000) * Exp_factor)

return 1
