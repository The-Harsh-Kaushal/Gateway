local PCValue = redis.call("HMGET",KEYS[1],"currentCapacity","lastReset");
local IpVAlue = redis.call("HMGET",KEYS[2],"currentCapacity","lastReset");

local capacity = tonumber(ARGV[1]);
local window_size= tonumber(ARGV[2]);
local date_now= tonumber(ARGV[3]);
local Ip_factor = tonumber(ARGV[4]);
local Exp_factor = tonumber(ARGV[5]);

if PCValue[1] == nil then
  PCValue[1] = capacity
  PCValue[2] = date_now
end
if IpVAlue[1] == nil then 
    IpVAlue[1]=capacity*Ip_factor
    IpVAlue[2]=date_now
end
--  pc_delta handles if there's any clock malfuction and value comes negitive
local pc_delta = math.max(date_now-tonumber(PCValue[2]),0);
local Ip_delta = math.max(date_now-tonumber(IpVAlue[2]),0);

local PC_inc_by = pc_delta/(window_size/capacity);
local Ip_inc_by = Ip_delta/(window_size/(capacity*Ip_factor));

local new_PC_capacity = math.min(capacity,tonumber(PCValue[1])+PC_inc_by);
local new_Ip_capacity =  math.min(capacity*Ip_factor,tonumber(IpVAlue[1])+Ip_inc_by);

if new_PC_capacity<1 or new_Ip_capacity<1 then 
return 0 
end

redis.call("HSET",KEYS[1],"currentCapacity",new_PC_capacity-1,"lastReset",date_now);
redis.call("EXPIRE",KEYS[1],(window_size/1000)*Exp_factor);
redis.call("HSET",KEYS[2],"currentCapacity",new_Ip_capacity-1,"lastReset",date_now);
redis.call("EXPIRE",KEYS[2],(window_size/1000)*Exp_factor);

return 1
