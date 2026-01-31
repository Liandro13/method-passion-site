interface AccommodationCardProps {
  name: string;
  image: string;
  features: readonly string[];
  isSelected: boolean;
  onClick: () => void;
}

export default function AccommodationCard({
  name,
  image,
  features,
  isSelected,
  onClick
}: AccommodationCardProps) {
  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer transform transition-all duration-300 hover:scale-105 ${
        isSelected ? 'ring-4 ring-primary ring-offset-2' : ''
      }`}
    >
      <div className="h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold text-dark mb-3">{name}</h3>
        
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 text-primary mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        
        {isSelected && (
          <div className="mt-4 text-center">
            <span className="inline-block bg-primary text-white text-sm px-3 py-1 rounded-full">
              Selecionado
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
