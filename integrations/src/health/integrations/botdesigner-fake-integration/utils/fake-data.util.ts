export function getFakeOrganizationUnitAddress(organizationUnitCode: string): string | undefined {
  const addresses = {
    '1': 'Rua das Flores, 123, Centro - São Paulo, SP - 01234-567',
    '2': 'Avenida Norte, 456, Zona Norte - São Paulo, SP - 02345-678',
  };

  return addresses[organizationUnitCode];
}
