export function parseAmazonViolationEmail(body: string, receivedDate?: Date) {
  // Extract driver name, driver ID, vehicle VIN
  const driverMatch = body.match(/your ([A-Z]+) \(([\w\d]+)\) driving VIN# ([\w\d]+)/i);
  // Extract violation type
  const violationTypeMatch = body.match(/unsafe behavior related to ([\w\s]+)/i);

  // Use receivedDate for date and time, not body
  let date: string | null = null;
  let time: string | null = null;

  if (receivedDate) {
    const dateObj = new Date(receivedDate);
    if (!isNaN(dateObj.getTime())) {
      date = dateObj.toISOString().slice(0, 10);     // 'YYYY-MM-DD'
      time = dateObj.toISOString().slice(11, 19);    // 'HH:MM:SS'
    }
  }

  return {
    driverName: driverMatch ? driverMatch[1] : null,
    driverId: driverMatch ? driverMatch[2] : null,
    vehicleVin: driverMatch ? driverMatch[3] : null,
    violationType: violationTypeMatch ? violationTypeMatch[1].trim() : null,
    date,
    time,
  };
}