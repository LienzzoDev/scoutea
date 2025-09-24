export interface Scout {
  id: string;
  name: string;
  email: string;
  specialization: string;
}

export async function createSampleScouts(): Promise<{ success: boolean; message: string; scouts?: Scout[] }> {
  try {
    // Mock implementation - replace with actual scout creation logic
    const sampleScouts: Scout[] = [
      {
        id: '1',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        specialization: 'Delanteros'
      },
      {
        id: '2',
        name: 'María García',
        email: 'maria@example.com',
        specialization: 'Defensas'
      },
      {
        id: '3',
        name: 'Carlos López',
        email: 'carlos@example.com',
        specialization: 'Mediocampistas'
      }
    ];

    // Simulate database insertion
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: `Created ${sampleScouts.length} sample scouts`,
      scouts: sampleScouts
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create sample scouts: ${error}`
    };
  }
}